/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Markup, Scenes, session, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { GroupsService } from '../groups/groups.service';
import { ModulesService } from '../modules/modules.service';
import { ManagerService, StateEnum } from './manager.service';
import { loadUser, saveUser, UserModule } from '../utils/file.utils';
import { getUserModuleString } from '../utils/utils';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;

  constructor(
    private readonly config: ConfigService,
    private readonly modulesService: ModulesService,
    private readonly groupsService: GroupsService,
    private readonly managerService: ManagerService,
  ) {
    const options = this.config.get<string>('BOT_TOKEN')!;
    this.bot = new Telegraf(options);
  }

  async onModuleInit() {
    this.registerHandlers();
    await this.bot.telegram.setMyCommands([
      { command: 'add', description: 'Ein Modul hinzufügen' },
      { command: 'remove', description: 'Ein Modul entfernen' },
      { command: 'clear', description: 'Alle Module entfernen' },
      { command: 'cancel', description: 'Command abbrechen' },
    ]);
    this.bot.launch();
  }

  onModuleDestroy() {
    this.bot.stop();
  }

  private registerHandlers() {
    this.bot.start((ctx) => ctx.reply('Bot gestartet 🚀'));

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

      const userModule = [
        chat.getModuleCode(),
        chat.getYear(),
        chat.getPeriod(),
      ] as UserModule;
      chat.setReady();
      const userModules = await loadUser(chat.id);
      userModules.push(userModule);
      await saveUser(chat.id, userModules);
      const text = `Benarichtigungen für die Prüfung ${getUserModuleString(userModule)} aktiviert.`;
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

      const userModules = await loadUser(chat.id);
      const buttons = userModules
        .map(getUserModuleString)
        .map((userModuleString) => [
          Markup.button.callback(
            userModuleString,
            `REMOVE_USER_MODULE:${userModuleString}`,
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
      const userModuleString = ctx.match[1];

      let userModules = await loadUser(chat.id);
      userModules = userModules.filter(
        (userModule) => userModuleString !== getUserModuleString(userModule),
      );
      await saveUser(chat.id, userModules);
      await ctx.reply(
        `Benarichtigungen für die Prüfung ${userModuleString} deaktiviert!`,
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
}
