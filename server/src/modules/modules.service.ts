/*
https://docs.nestjs.com/providers#services
*/

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { loadAllTimetables } from '../utils/file.utils';
import { Module } from '@shared/types/Module';
import { getDistinct, getDistinctObjects, getGroup } from '../utils/utils';

@Injectable()
export class ModulesService {
  private readonly logger = new Logger(ModulesService.name);

  async getModules(seminarGroupId: string) {
    try {
      const timetables = await loadAllTimetables(seminarGroupId);
      const blocks = timetables.flat(1);
      const moduleCodes = getDistinct(blocks.map((block) => block.title));

      return moduleCodes.map((moduleCode) => {
        const filteredBlocks = blocks.filter(
          (block) => block.title === moduleCode,
        );
        const moduleName = filteredBlocks.at(0)?.description;
        const groups = getDistinct(
          filteredBlocks.map(getGroup).filter((group) => group !== undefined),
        );
        return {
          code: moduleCode,
          name: moduleName,
          groups: groups.length > 0 ? groups : undefined,
        } as Module;
      });
    } catch (error) {
      this.logger.error(`Modules couldn't be loaded\n${error}`);
      throw new InternalServerErrorException("Modules couldn't be loaded");
    }
  }

  async hasGroups(seminarGroupId: string, moduleCode: string) {
    const modules = await this.getModules(seminarGroupId);
    const module = modules.find((module) => module.code === moduleCode);
    return !!module?.groups;
  }

  async getModuleInfo(
    seminarGroupId: string,
    moduleCode: string,
    group?: string,
  ) {
    try {
      const timetables = await loadAllTimetables(seminarGroupId);
      const blocks = timetables.flat(1);
      let filteredBlocks = blocks.filter((block) => block.title === moduleCode);
      if (group)
        filteredBlocks = filteredBlocks.filter(
          (block) => getGroup(block) === group || getGroup(block) === undefined,
        );

      return getDistinctObjects(filteredBlocks);
    } catch (error) {
      this.logger.error(`Module info couldn't be loaded\n${error}`);
      throw new InternalServerErrorException("Module info couldn't be loaded");
    }
  }
}
