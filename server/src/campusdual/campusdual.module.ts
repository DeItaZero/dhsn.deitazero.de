/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { CampusdualService } from './campusdual.service';

@Module({
  imports: [],
  controllers: [],
  providers: [CampusdualService],
})
export class CampusdualModule {}
