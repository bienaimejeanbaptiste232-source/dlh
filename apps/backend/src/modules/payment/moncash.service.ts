import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface MoncashTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  jti: string;
}

export interface MoncashPaymentInitResponse {
  mode: string;
  path: string;
  payment_token: {
    expired: string;
    created: string;
    token: string;
  };
  timestamp: number;
  status: number;
}

export interface MoncashTransactionStatus {
  payment: {
    reference: string;           // orderId que vous avez envoyé
    transaction_id: string;      // ID MonCash unique
    cost: number;
    message: string;             // "successful" | "failed" | "pending"
    payer: string;               // numéro Moncash du payeur
  };
  timestamp: number;
  status: number;
}

export interface InitiatePaymentResult {
  redirectUrl: string;
  paymentToken: string;
  tokenExpiresAt: string;
  moncashOrderRef: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class MoncashService {
  private readonly logger = new Logger(MoncashService.name);

  // Environnement basé sur NODE_ENV
  private readonly isProduction = process.env.NODE_ENV === 'production';

  private get apiHost(): string {
    return this.isProduction
      ? 'moncashbutton.digicelgroup.com'
      : 'sandbox.moncashbutton.digicelgroup.com';
  }

  private get gatewayBase(): string {
    return this.isProduction
      ? 'https://moncashbutton.digicelgroup.com/Moncash-middleware'
      : 'https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware';
  }

  // Cache du token OAuth (évite d'en redemander un à chaque appel)
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  // ── 1. Authentification OAuth2 ───────────────────────────────────────────

  /**
   * Récupère un Bearer token via client_credentials.
   * Le token est mis en cache jusqu'à 60 secondes avant son expiration.
   * Les credentials ne transitent JAMAIS vers le client mobile.
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Retourner le token en cache s'il est encore valide (marge 60s)
    if (this.cachedToken && now < this.tokenExpiresAt - 60_000) {
      return this.cachedToken;
    }

    const clientId = process.env.MONCASH_CLIENT_ID;
    const clientSecret = process.env.MONCASH_SECRET;

    if (!clientId || !clientSecret) {
      throw new HttpException(
        'MonCash credentials manquants dans la configuration serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Encodage Base64 des credentials (Basic Auth)
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      // IMPORTANT: MonCash requiert scope=read,write sinon → invalid_scope
      const body = 'grant_type=client_credentials&scope=read%2Cwrite';
      const response = await this.httpsPost<MoncashTokenResponse>(
        this.apiHost,
        '/Api/oauth/token',
        body,
        {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      );

      this.cachedToken = response.access_token;
      // expires_in est en secondes
      this.tokenExpiresAt = now + response.expires_in * 1000;

      this.logger.log(`[MonCash] Token OAuth obtenu, expire dans ${response.expires_in}s`);
      return this.cachedToken;
    } catch (err) {
      this.cachedToken = null;
      this.tokenExpiresAt = 0;
      this.logger.error('[MonCash] Échec obtention token OAuth', err);
      throw new HttpException(
        'Impossible de contacter MonCash. Réessayez.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── 2. Initiation du paiement ────────────────────────────────────────────

  /**
   * Crée une demande de paiement MonCash.
   * @param orderId  Votre référence interne unique (UUID de la commande)
   * @param amount   Montant en HTG
   * @returns URL de redirection vers la page MonCash + token
   *
   * SÉCURITÉ :
   * - orderId doit être unique par tentative de paiement
   * - amount est toujours calculé côté serveur, jamais accepté tel quel du client
   */
  async initiatePayment(orderId: string, amount: number): Promise<InitiatePaymentResult> {
    if (amount <= 0) {
      throw new HttpException('Montant invalide', HttpStatus.BAD_REQUEST);
    }

    const token = await this.getAccessToken();

    const payload = JSON.stringify({ orderId, amount });

    try {
      const response = await this.httpsPost<MoncashPaymentInitResponse>(
        this.apiHost,
        '/Api/v1/CreatePayment',
        payload,
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      );

      if (!response.payment_token?.token) {
        throw new Error('Token de paiement absent dans la réponse MonCash');
      }

      const redirectUrl = `${this.gatewayBase}/Payment/Redirect?token=${response.payment_token.token}`;

      this.logger.log(`[MonCash] Paiement initié | orderId=${orderId} | amount=${amount} HTG`);

      return {
        redirectUrl,
        paymentToken: response.payment_token.token,
        tokenExpiresAt: response.payment_token.expired,
        moncashOrderRef: orderId,
      };
    } catch (err) {
      this.logger.error(`[MonCash] Échec initiation paiement | orderId=${orderId}`, err);
      throw new HttpException(
        'Erreur lors de la création du paiement MonCash',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── 3. Vérification server-to-server ────────────────────────────────────

  /**
   * Vérifie le statut d'une transaction par orderId.
   *
   * RÈGLE DE SÉCURITÉ CRITIQUE :
   * Ne jamais confirmer un paiement sur la base du redirect URL seul.
   * Toujours appeler cette méthode après le retour utilisateur.
   */
  async verifyByOrderId(orderId: string): Promise<MoncashTransactionStatus> {
    const token = await this.getAccessToken();

    try {
      const response = await this.httpsPost<MoncashTransactionStatus>(
        this.apiHost,
        '/Api/v1/Payment/getPaymentByOrderId',
        JSON.stringify({ orderId }),
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      );

      this.logger.log(
        `[MonCash] Vérification | orderId=${orderId} | status=${response.payment?.message}`,
      );

      return response;
    } catch (err) {
      this.logger.error(`[MonCash] Échec vérification | orderId=${orderId}`, err);
      throw new HttpException(
        'Impossible de vérifier le statut du paiement',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Vérifie le statut d'une transaction par transactionId MonCash.
   */
  async verifyByTransactionId(transactionId: string): Promise<MoncashTransactionStatus> {
    const token = await this.getAccessToken();

    try {
      const response = await this.httpsPost<MoncashTransactionStatus>(
        this.apiHost,
        '/Api/v1/Payment/getPaymentByTransId',
        JSON.stringify({ transactionId }),
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      );

      this.logger.log(
        `[MonCash] Vérif par transId=${transactionId} | status=${response.payment?.message}`,
      );

      return response;
    } catch (err) {
      this.logger.error(`[MonCash] Échec vérification transId=${transactionId}`, err);
      throw new HttpException(
        'Impossible de vérifier le statut du paiement',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── 4. Helper HTTP sécurisé ──────────────────────────────────────────────

  /**
   * Effectue une requête HTTPS POST vers l'API MonCash.
   * Toujours en HTTPS, timeout de 15 secondes, TLS strict en production.
   */
  private httpsPost<T>(
    host: string,
    path: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: host,
        path,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body),
        },
        // En production, valider le certificat TLS. En sandbox, tolérer les certs auto-signés.
        rejectUnauthorized: this.isProduction,
        timeout: 15_000, // 15 secondes max
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 400) {
              reject(
                new Error(`MonCash HTTP ${res.statusCode}: ${data}`),
              );
              return;
            }
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`Réponse MonCash non-JSON: ${data}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout MonCash (15s)'));
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
