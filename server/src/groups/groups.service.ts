/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { loadSeminarGroupIds } from '../utils/file.utils';

@Injectable()
export class GroupsService {
  async getSeminarGroupIds() {
    return await loadSeminarGroupIds();
  }
}
