/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { GroupsService } from '../groups/groups.service';
import { ModulesService } from '../modules/modules.service';
import { ManagerService, StateEnum } from './manager.service';
import { loadUser, saveUser, Exam } from '../utils/file.utils';
import { getModuleCode, getExamString } from '../utils/utils';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampusdualService } from '../campusdual/campusdual.service';
import { generateExamResultImage } from '../utils/image_util';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;

  constructor(
    private readonly config: ConfigService,
    private readonly modulesService: ModulesService,
    private readonly groupsService: GroupsService,
    private readonly managerService: ManagerService,
    private readonly campusdualService: CampusdualService,
  ) {
    const options = this.config.get<string>('BOT_TOKEN')!;
    this.bot = new Telegraf(options);
  }

  async onModuleInit() {
    this.registerHandlers();
    await this.bot.telegram.setMyCommands([
      { command: 'show', description: 'Alle Prüfungen anzeigen' },
      { command: 'add', description: 'Eine Prüfung hinzufügen' },
      { command: 'remove', description: 'Eine Prüfung entfernen' },
      { command: 'clear', description: 'Alle Prüfungen entfernen' },
      { command: 'cancel', description: 'Command abbrechen' },
    ]);
    this.bot.launch();
  }

  onModuleDestroy() {
    this.bot.stop();
  }

  private registerHandlers() {
    this.bot.start((ctx) => ctx.reply('Bot gestartet 🚀'));

    this.bot.command('show', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) {
        await ctx.reply('Nicht bereit!');
        return;
      }
      const exams = await loadUser(chat.id);
      const examString =
        exams
          .map(getExamString)
          .map((examString) => `- ${examString}`)
          .join('\n') || 'Keine Prüfungen';

      await ctx.reply(
        `Du hast Benachrichtigung für die folgenden Prüfungen aktiviert:\n${examString}`,
      );

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.command('add', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) {
        await ctx.reply('Nicht bereit!');
        return;
      }

      const groups = await this.groupsService.getSeminarGroupIds();
      const buttons = groups.map((group) => [
        Markup.button.callback(group, `ADD_SEMINAR_GROUP_ID:${group}`),
      ]);
      const inlineKeyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply('Wähle deine Seminargruppe aus:', inlineKeyboard);

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.action(/ADD_SEMINAR_GROUP_ID:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) return;
      const groupId = ctx.match[1];
      chat.setSeminarGroupId(groupId);

      const modules = await this.modulesService.getModules(groupId);
      const buttons = modules.map((module) => [
        Markup.button.callback(module.name, `ADD_MODULE_CODE:${module.code}`),
      ]);
      const inlineKeyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply(`Wähle ein Modul aus:`, inlineKeyboard);

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.action(/ADD_MODULE_CODE:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.ADD_SEMINAR_GROUP_ID_SET) return;
      const moduleCode = ctx.match[1];
      chat.setModuleCode(moduleCode);

      const years = new Array(10)
        .fill(0)
        .map((_, i) => new Date().getFullYear() + 1 - i)
        .map((year) => year.toString());
      const buttons = years.map((year) => [
        Markup.button.callback(year, `ADD_YEAR:${year}`),
      ]);
      const inlineKeyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply(`Wähle das Jahr aus:`, inlineKeyboard);

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.action(/ADD_YEAR:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.ADD_MODULE_CODE_SET) return;
      const year = +ctx.match[1];
      chat.setYear(year);

      const buttons = [
        Markup.button.callback('Sommersemester', 'ADD_PERIOD:SS'),
        Markup.button.callback('Wintersemester', 'ADD_PERIOD:WS'),
      ];
      const inlineKeyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply(`Wähle das Semester aus:`, inlineKeyboard);

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.action(/ADD_PERIOD:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.ADD_YEAR_SET) return;
      const period = ctx.match[1];
      chat.setPeriod(period);

      const exam = [
        chat.getModuleCode(),
        chat.getYear(),
        chat.getPeriod(),
      ] as Exam;
      chat.setReady();
      const exams = await loadUser(chat.id);
      exams.push(exam);
      await saveUser(chat.id, exams);
      const text = `Benarichtigungen für die Prüfung ${getExamString(exam)} aktiviert.`;
      await ctx.reply(text);

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.command('remove', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) {
        await ctx.reply('Nicht bereit!');
        return;
      }

      const exams = await loadUser(chat.id);
      const buttons = exams
        .map(getExamString)
        .map((examString) => [
          Markup.button.callback(
            examString,
            `REMOVE_USER_MODULE:${examString}`,
          ),
        ]);
      const inlineKeyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply('Wähle eine Prüfung aus:', inlineKeyboard);

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.action(/REMOVE_USER_MODULE:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) return;
      const examString = ctx.match[1];

      let exams = await loadUser(chat.id);
      exams = exams.filter((exam) => examString !== getExamString(exam));
      await saveUser(chat.id, exams);
      await ctx.reply(
        `Benarichtigungen für die Prüfung ${examString} deaktiviert!`,
      );

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.command('clear', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) {
        await ctx.reply('Nicht bereit!');
        return;
      }

      const buttons = [
        Markup.button.callback('Bestätigen', 'CLEAR_USER_MODULES:CONFIRM'),
        Markup.button.callback('Abbrechen', 'CLEAR_USER_MODULES:CANCEL'),
      ];
      const inlineKeyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply(
        'Bestätige, Benarichtigungen für alle Prüfungen zu deaktivieren:',
        inlineKeyboard,
      );

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.action(/CLEAR_USER_MODULES:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) return;
      const confirmed = ctx.match[1];
      if (confirmed === 'CONFIRM') {
        await saveUser(chat.id, []);
        await ctx.reply(`Benarichtigungen für alle Prüfungen deaktiviert!`);
      } else {
        await ctx.reply('Abgebrochen!');
      }

      try {
        ctx.deleteMessage();
      } catch (e) {
        console.log(e);
      }
    });

    this.bot.command('cancel', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state === StateEnum.READY) {
        ctx.reply('Bereits bereit!');
        return;
      }

      chat.setReady();
      ctx.reply('Abgebrochen!');
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const newResults = await this.campusdualService.checkExams();
    for (let [chatId, ownNewResults] of newResults.entries()) {
      for (let newResult of ownNewResults) {
        const image = await generateExamResultImage(newResult);
        await this.bot.telegram.sendPhoto(
          chatId,
          { source: image },
          {
            caption: `Neues Ergebnis für ${getExamString(newResult.exam)}!`,
          },
        );
      }
    }
  }
}
