import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('Public Settings')
@Controller('settings-public')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance mode status' })
  async getMaintenanceMode() {
    const maintenance = await this.settingsService.isMaintenanceMode();
    return { maintenance };
  }
}
