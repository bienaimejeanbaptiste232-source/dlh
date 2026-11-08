import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../database/entities/user.entity';
import { DriverProfile, DriverStatus, VehicleType } from '../../database/entities/driver.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  // Stockage temporaire des OTPs en mémoire (ou Redis)
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DriverProfile)
    private readonly driverRepo: Repository<DriverProfile>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: [{ phoneNumber: dto.phoneNumber }, ...(dto.email ? [{ email: dto.email }] : [])],
    });

    if (existing) {
      throw new ConflictException('Un utilisateur existe déjà avec ce numéro ou cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role || UserRole.CUSTOMER,
      languagePreference: dto.languagePreference || 'fr',
    });

    const savedUser = await this.userRepo.save(user);

    // Initialisation du portefeuille virtuel
    await this.walletRepo.save({
      userId: savedUser.id,
      balance: 0.0,
      currency: 'HTG',
    });

    // Si c'est un livreur, créer le profil de conduite
    if (savedUser.role === UserRole.DRIVER) {
      await this.driverRepo.save({
        id: savedUser.id,
        vehicleType: VehicleType.MOTORCYCLE,
        status: DriverStatus.OFFLINE,
        isVerified: false,
        ratingAvg: 5.0,
        totalRatings: 0,
      });
    }

    // Synchronisation automatique vers Supabase (Source de vérité globale)
    try {
      const supaUrl = process.env.SUPABASE_URL || 'https://xwmxgpdkmrzoraibdzrf.supabase.co';
      const supaKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQyMDYxMywiZXhwIjoyMTA2OTk2NjEzfQ.Bg6Sv7HR35FShSu9QiTpYcYKUq8RrH3tg0IPFYq6zQU';
      const supaHeaders = {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      };

      await fetch(`${supaUrl}/rest/v1/users`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify({
          id: savedUser.id,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          phoneNumber: savedUser.phoneNumber,
          email: savedUser.email || null,
          passwordHash: savedUser.passwordHash,
          role: savedUser.role,
          isActive: savedUser.isActive,
          isPhoneVerified: true,
          languagePreference: savedUser.languagePreference || 'ht',
        }),
      });

      await fetch(`${supaUrl}/rest/v1/wallets`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify({
          userId: savedUser.id,
          balance: 0.0,
          currency: 'HTG',
          isFrozen: false,
        }),
      });
    } catch (supaErr) {
      console.warn('⚠️ Supabase sync warning in AuthService:', supaErr);
    }

    const tokens = this.generateTokens(savedUser);
    return {
      user: this.sanitizeUser(savedUser),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: [{ phoneNumber: dto.identifier }, { email: dto.identifier }],
    });

    if (!user) {
      throw new UnauthorizedException('Numéro de téléphone ou mot de passe incorrect.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte a été désactivé par l’administration.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Numéro de téléphone ou mot de passe incorrect.');
    }

    const tokens = this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_delivery_haiti_long_lived',
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Session invalide.');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré.');
    }
  }

  async sendOtp(dto: SendOtpDto) {
    // Génération d'un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.otpStore.set(dto.phoneNumber, { code, expiresAt });

    // En environnement de dev / démo, on logue le code dans la console
    console.log(`📱 [SMS HAÏTI] Envoi OTP au ${dto.phoneNumber} : Votre code est ${code}`);

    return {
      success: true,
      message: `Code de vérification envoyé par SMS au ${dto.phoneNumber}`,
      // En dev, on retourne le code pour faciliter les tests automatisés
      debugCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const record = this.otpStore.get(dto.phoneNumber);
    if (!record) {
      throw new BadRequestException('Aucun code en attente pour ce numéro. Demandez un nouveau code.');
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(dto.phoneNumber);
      throw new BadRequestException('Le code de vérification a expiré.');
    }

    if (record.code !== dto.code) {
      throw new BadRequestException('Code de vérification invalide.');
    }

    this.otpStore.delete(dto.phoneNumber);

    const user = await this.userRepo.findOne({ where: { phoneNumber: dto.phoneNumber } });
    if (user) {
      user.isPhoneVerified = true;
      await this.userRepo.save(user);
    }

    return {
      success: true,
      message: 'Numéro de téléphone vérifié avec succès.',
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const wallet = await this.walletRepo.findOne({ where: { userId } });
    let driverProfile = null;

    if (user.role === UserRole.DRIVER) {
      driverProfile = await this.driverRepo.findOne({ where: { id: userId } });
    }

    return {
      user: this.sanitizeUser(user),
      wallet,
      driverProfile,
    };
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, role: user.role, phone: user.phoneNumber };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_delivery_haiti_2026_secure',
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_delivery_haiti_long_lived',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
