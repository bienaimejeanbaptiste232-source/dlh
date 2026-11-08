import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

/**
 * RÈGLES DE SÉCURITÉ DE CE CONTROLLER :
 * 1. Tous les endpoints requièrent un JWT valide (@UseGuards)
 * 2. Le userId vient toujours du token JWT (@CurrentUser), jamais du body
 * 3. Le montant n'est jamais accepté depuis le client
 * 4. Aucune clé MonCash n'est exposée dans les réponses
 */
@UseGuards(JwtAuthGuard)
@Controller('api/v1/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /api/v1/payments/moncash/initiate
   * Initie un paiement MonCash pour une commande.
   * Retourne l'URL de redirection vers la page MonCash.
   */
  @Post('moncash/initiate')
  @HttpCode(HttpStatus.OK)
  async initiateMonCash(
    @CurrentUser() user: User,
    @Body() dto: InitiatePaymentDto,
  ) {
    const result = await this.paymentService.initiatePayment(user.id, dto);
    return {
      success: true,
      data: result,
      message: 'Redirijye itilizatè a sou paj MonCash la',
    };
  }

  /**
   * POST /api/v1/payments/moncash/verify
   * Vérifie le statut d'un paiement après retour de la page MonCash.
   * La vérification se fait server-to-server (jamais confier au client).
   */
  @Post('moncash/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMonCash(
    @CurrentUser() user: User,
    @Body() dto: VerifyPaymentDto,
  ) {
    const result = await this.paymentService.verifyAndConfirmPayment(user.id, dto);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/v1/payments/status/:orderId
   * Retourne le statut courant d'un paiement.
   * Le transactionReference n'est exposé que si le paiement est COMPLETED.
   */
  @Get('status/:orderId')
  async getStatus(
    @CurrentUser() user: User,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.paymentService.getPaymentStatus(user.id, orderId);
    return {
      success: true,
      data: result,
    };
  }
}
