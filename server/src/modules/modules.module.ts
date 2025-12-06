/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';

@Module({
  imports: [],
  controllers: [ModulesController],
  providers: [ModulesService],
})
export class ModulesModule {}
