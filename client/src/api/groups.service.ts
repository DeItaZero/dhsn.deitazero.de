import { http } from "./http";

export const GroupsService = {
	get() {
		return http<string[]>("/api/groups");
	},
};
