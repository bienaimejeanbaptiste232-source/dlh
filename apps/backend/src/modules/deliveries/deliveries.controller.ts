import { Controller, Post, Patch, Get, Body, Param, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { DriverStatus } from '../../database/entities/driver.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Roles(UserRole.DRIVER)
  @Patch('status')
  async updateStatus(@CurrentUser() user: User, @Body('status') status: DriverStatus) {
    const updated = await this.deliveriesService.setStatus(user.id, status);
    return {
      success: true,
      data: updated,
    };
  }

  @Roles(UserRole.DRIVER)
  @Post('location')
  async updateLocation(
    @CurrentUser() user: User,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return await this.deliveriesService.updateLocation(user.id, latitude, longitude);
  }

  /**
   * Retourne la MISSION ACTIVE en cours pour CE livreur uniquement.
   * Un chauffeur ne peut jamais voir les commandes d'un autre.
   */
  @Roles(UserRole.DRIVER)
  @Get('missions/my-active')
  async getMyActiveMission(@CurrentUser() user: User) {
    const mission = await this.deliveriesService.getMyActiveMission(user.id);
    return {
      success: true,
      data: mission,
      hasMission: mission !== null,
    };
  }

  /**
   * Vérifie si le dispatch a envoyé une mission à ce chauffeur
   * (utilisé au login ou après reconnexion pour récupérer une mission manquée).
   */
  @Roles(UserRole.DRIVER)
  @Get('missions/pending-for-me')
  async getPendingDispatchedMission(@CurrentUser() user: User) {
    const mission = await this.deliveriesService.getPendingDispatchedMission(user.id);
    return {
      success: true,
      data: mission,
      hasPendingMission: mission !== null,
    };
  }

  @Roles(UserRole.DRIVER)
  @Post('missions/:orderId/accept')
  async acceptMission(@CurrentUser() user: User, @Param('orderId') orderId: string) {
    const order = await this.deliveriesService.acceptMission(user.id, orderId);
    return {
      success: true,
      data: order,
      message: 'Mission aksepte! Ale nan restoran an.',
    };
  }

  @Roles(UserRole.DRIVER)
  @Post('missions/:orderId/confirm-pickup')
  async confirmPickup(@CurrentUser() user: User, @Param('orderId') orderId: string) {
    const order = await this.deliveriesService.confirmPickup(user.id, orderId);
    return {
      success: true,
      data: order,
      message: 'Kòmand rekipere. Ale bay kliyan an!',
    };
  }

  @Roles(UserRole.DRIVER)
  @Post('missions/:orderId/confirm-delivery')
  async confirmDelivery(@CurrentUser() user: User, @Param('orderId') orderId: string) {
    const order = await this.deliveriesService.confirmDelivery(user.id, orderId);
    return {
      success: true,
      data: order,
      message: 'Livrezon fini avèk siksè! Lajan kredite sou kont ou.',
    };
  }
}
