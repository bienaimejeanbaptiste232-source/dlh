import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSetting } from '../../database/entities/platform-setting.entity';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsService } from './platform-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformSetting])],
  controllers: [PlatformSettingsController],
  exports: [PlatformSettingsService],
  providers: [PlatformSettingsService],
})
export class PlatformSettingsModule {}

