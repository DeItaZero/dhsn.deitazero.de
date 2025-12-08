import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
