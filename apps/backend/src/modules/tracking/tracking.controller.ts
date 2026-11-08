import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Consulter l'état complet de suivi d'une livraison (route, ETA, position en direct)
   */
  @Get('delivery/:orderId')
  async getDeliveryTracking(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = req.user?.id || 'guest';
    const userRole = req.user?.role || 'CUSTOMER';
    return this.trackingService.getOrderTrackingState(orderId, userId, userRole);
  }
}
