/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { loadAllTimetables } from '../utils/file.utils';
import { Block } from '@shared/types/block.types';
import { Module } from '@shared/types/modules.types';
import { getDistinct, getGroup } from '../utils/utils';

@Injectable()
export class ModulesService {
  async getModules(seminarGroupId: string) {
    const timetables = await loadAllTimetables(seminarGroupId);
    const blocks = timetables.flat(1);
    const moduleNames = getDistinct(blocks.map((block) => block.title));

    return moduleNames.map((moduleName) => {
      const filteredBlocks = blocks.filter(
        (block) => block.title === moduleName,
      );
      const groups = getDistinct(
        filteredBlocks.map(getGroup).filter((group) => group !== undefined),
      );
      return {
        name: moduleName,
        groups: groups.length > 0 ? groups : undefined,
      } as Module;
    });
  }
}
