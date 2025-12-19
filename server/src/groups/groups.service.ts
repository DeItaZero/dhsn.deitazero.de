/*
https://docs.nestjs.com/providers#services
*/

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { loadSeminarGroupIds } from '../utils/file.utils';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  async getSeminarGroupIds() {
    try {
      return await loadSeminarGroupIds();
    } catch (error) {
      this.logger.error(`Seminar group ids couldn't be loaded\n${error}`);
      throw new InternalServerErrorException(
        "Seminar group ids couldn't be loaded",
      );
    }
  }
}
