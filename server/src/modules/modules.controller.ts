/*
https://docs.nestjs.com/controllers#controllers
*/

import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ModulesService } from './modules.service';
import {
  isValidGroup,
  isValidModuleCode,
  isValidSeminarGroupId,
} from '../utils/validators';

@Controller('api/modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  async getAllModules(@Query('seminarGroupId') seminarGroupId: string) {
    if (!isValidSeminarGroupId(seminarGroupId))
      throw new BadRequestException('Seminar group id invalid');

    return await this.modulesService.getModules(seminarGroupId);
  }

  @Get('/info')
  async getModuleInfo(
    @Query('seminarGroupId') seminarGroupId: string,
    @Query('moduleCode') moduleCode: string,
    @Query('group') group: string,
  ) {
    if (!isValidSeminarGroupId(seminarGroupId))
      throw new BadRequestException('Seminar group id invalid');

    if (!isValidModuleCode(moduleCode))
      throw new BadRequestException('Module code invalid');

    const hasGroups = await this.modulesService.hasGroups(
      seminarGroupId,
      moduleCode,
    );

    if (hasGroups && !isValidGroup(group))
      throw new BadRequestException('Group invalid');

    return await this.modulesService.getModuleInfo(
      seminarGroupId,
      moduleCode,
      group,
    );
  }
}
