import { Controller, Get, Param, Query, Patch, Body, UseGuards } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@Controller('api/v1/merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('zoneId') zoneId?: string,
  ) {
    const list = await this.merchantsService.findAll({ search, type, zoneId });
    return {
      success: true,
      data: list,
    };
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    const details = await this.merchantsService.findOne(id);
    return {
      success: true,
      data: details,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body('isOpen') isOpen: boolean) {
    const updated = await this.merchantsService.toggleStatus(id, isOpen);
    return {
      success: true,
      data: updated,
      message: `Statut mis à jour : ${isOpen ? 'Ouvert' : 'Fermé'}`,
    };
  }
}
