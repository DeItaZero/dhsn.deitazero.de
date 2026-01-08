import type { Block } from "@shared/types/Block";
import { http } from "./http";

export const TimerService = {
  get() {
    return http<Block[]>("/api/timer?seminarGroupId=CS23-2");
  },
};
