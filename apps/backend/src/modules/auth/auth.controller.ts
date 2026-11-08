import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return {
      success: true,
      data: await this.authService.register(dto),
      message: 'Compte créé avec succès',
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return {
      success: true,
      data: await this.authService.login(dto),
      message: 'Connexion réussie',
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return {
      success: true,
      data: await this.authService.refreshToken(dto.refreshToken),
    };
  }

  @Post('otp/send')
  async sendOtp(@Body() dto: SendOtpDto) {
    return await this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return await this.authService.verifyOtp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: User) {
    return {
      success: true,
      data: await this.authService.getProfile(user.id),
    };
  }
}
