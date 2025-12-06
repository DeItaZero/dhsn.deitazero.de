/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Query } from '@nestjs/common';
import { ModulesService } from './modules.service';

@Controller('api/modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  async getAllModules(@Query('seminarGroupId') seminarGroupId: string) {
    return await this.modulesService.getModules(seminarGroupId);
  }
}
