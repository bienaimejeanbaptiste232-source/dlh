import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { OrderStatus } from '../../database/entities/order.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.SUPER_ADMIN)
@Controller('api/v1/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  async getDashboard() {
    const stats = await this.financeService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get('transactions')
  async getTransactions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.financeService.getTransactions(
      page ? +page : 1,
      limit ? +limit : 20,
    );
    return { success: true, ...result };
  }

  @Get('orders')
  async getOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    const result = await this.financeService.getOrders(
      page ? +page : 1,
      limit ? +limit : 20,
      status,
    );
    return { success: true, ...result };
  }

  @Get('wallets')
  async getWallets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.financeService.getWallets(
      page ? +page : 1,
      limit ? +limit : 20,
    );
    return { success: true, ...result };
  }

  @Get('drivers/report')
  async getDriversReport() {
    const report = await this.financeService.getDriversReport();
    return { success: true, data: report };
  }
}
