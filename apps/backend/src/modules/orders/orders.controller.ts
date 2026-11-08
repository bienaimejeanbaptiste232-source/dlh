import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    const result = await this.ordersService.createOrder(user.id, dto);
    return {
      success: true,
      data: result,
      message: 'Commande validée avec succès !',
    };
  }

  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: User) {
    const list = await this.ordersService.findMyOrders(user.id);
    return {
      success: true,
      data: list,
    };
  }

  @Get('merchant/:merchantId')
  async getMerchantOrders(@Param('merchantId') merchantId: string) {
    const list = await this.ordersService.findMerchantOrders(merchantId);
    return {
      success: true,
      data: list,
    };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const data = await this.ordersService.findOne(id);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    const updated = await this.ordersService.updateStatus(id, dto);
    return {
      success: true,
      data: updated,
      message: `Statut de la commande mis à jour : ${dto.status}`,
    };
  }

  /**
   * Endpoint admin: relanse dispatch pou yon kòmand espesifik.
   * Rele triggerDispatch -> jwenn meilleur chofè -> voye WebSocket alert ba li.
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':orderId/dispatch')
  async dispatchOrder(@Param('orderId') orderId: string) {
    const result = await this.ordersService.manualDispatch(orderId);
    return {
      success: true,
      data: result,
      message: result.dispatched
        ? `Kòmand voye ba chofè ${result.driverName} (score: ${result.score})`
        : 'Pa gen chofè disponib kounye a. Eseye ankò nan kèk minit.',
    };
  }

  /**
   * Endpoint admin: asinye yon chofè espesifik ba yon kòmand manyèlman
   * epi voye alèt WebSocket ba chofè sa a.
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':orderId/assign-driver')
  async assignDriverManually(
    @Param('orderId') orderId: string,
    @Body('driverId') driverId: string,
  ) {
    const result = await this.ordersService.manualAssignDriver(orderId, driverId);
    return {
      success: true,
      data: result,
      message: `Chofè asinye ba kòmand #${result.orderNumber} avèk siksè!`,
    };
  }
}
