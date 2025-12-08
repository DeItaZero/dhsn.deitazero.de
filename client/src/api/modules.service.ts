import { http } from "./http";
import type { Module } from "@shared/types/modules.types";
import type { Block } from "@shared/types/block.types";

export const ModulesService = {
	get(seminarGroupId: string) {
		return http<Module[]>(`/api/modules?seminarGroupId=${seminarGroupId}`);
	},

	getInfo(seminarGroupId: string, moduleCode: string, group?: string) {
		return http<Block[]>(`/api/modules/info?seminarGroupId=${seminarGroupId}&moduleCode=${moduleCode}&group=${group}`);
	},
};
