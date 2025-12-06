/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { getAllTimetables } from '../utils/file.utils';
import { Block } from '@shared/types/block.types';
import { Module } from '@shared/types/modules.types';
import { getDistinct } from '../utils/utils';

@Injectable()
export class ModulesService {
  async getModules(seminarGroupId: string) {
    const timetables = await getAllTimetables(seminarGroupId);
    const blocks = timetables.flat(1);
    const moduleNames = getDistinct(blocks.map((block) => block.title));

    const getGroup = (block: Block) =>
      /Gruppe (\w+)/.exec(block.remarks)?.at(1);

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
