/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { GroupsService } from '../groups/groups.service';
import { ModulesService } from '../modules/modules.service';
import { ManagerService } from './manager.service';

@Module({
  imports: [],
  controllers: [],
  providers: [TelegramService, GroupsService, ModulesService, ManagerService],
})
export class TelegramModule {}
