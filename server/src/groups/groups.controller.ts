/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('api/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getSeminarGroupIds() {
    return await this.groupsService.getSeminarGroupIds();
  }
}
