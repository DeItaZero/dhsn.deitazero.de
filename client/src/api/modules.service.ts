import { http } from "./http";
import type { Module } from "@shared/types/modules.types";

export const ModulesService = {
	get(seminarGroupId: string) {
		return http<Module[]>(`/api/modules?seminarGroupId=${seminarGroupId}`);
	},
};
