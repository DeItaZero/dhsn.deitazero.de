/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';

export enum StateEnum {
  READY,
  ADD_SEMINAR_GROUP_ID_SET,
  ADD_MODULE_CODE_SET,
  ADD_YEAR_SET,
  ADD_PERIOD_SET,
}

export class Chat {
  private seminarGroupId?: string;
  private moduleCode?: string;
  private year?: number;
  private period?: string;

  public id: number;
  public state: StateEnum = StateEnum.READY;

  constructor(chatId: number) {
    this.id = chatId;
  }

  setReady() {
    this.state = StateEnum.READY;
  }

  setSeminarGroupId(groupId: string) {
    this.seminarGroupId = groupId;
    this.state = StateEnum.ADD_SEMINAR_GROUP_ID_SET;
  }

  getSeminarGroupId() {
    return this.seminarGroupId!;
  }

  setModuleCode(code: string) {
    this.moduleCode = code;
    this.state = StateEnum.ADD_MODULE_CODE_SET;
  }

  getModuleCode() {
    return this.moduleCode!;
  }

  setYear(year: number) {
    this.year = year;
    this.state = StateEnum.ADD_YEAR_SET;
  }

  getYear() {
    return this.year!;
  }

  setPeriod(period: string) {
    this.period = period;
    this.state = StateEnum.ADD_PERIOD_SET;
  }

  getPeriod() {
    return this.period!;
  }
}

@Injectable()
export class ManagerService {
  private chats: Map<number, Chat> = new Map();

  load(ctx: Context) {
    const chatId = ctx.chat!.id;
    let chat = this.chats.get(chatId);
    if (chat === undefined) {
      chat = new Chat(chatId);
      this.chats.set(chatId, chat);
    }
    return chat;
  }
}
