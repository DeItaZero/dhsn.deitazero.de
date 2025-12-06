import { http } from "./http";
import type { Module } from "@shared/types/modules.types";

export const ModulesService = {
	getAll() {
		return http<Module[]>("/api/modules");
	},
};
