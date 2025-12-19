/*
https://docs.nestjs.com/providers#services
*/

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Context, Markup, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { GroupsService } from '../groups/groups.service';
import { ModulesService } from '../modules/modules.service';
import { ManagerService, StateEnum } from './manager.service';
import { loadUser, saveUser } from '../utils/file.utils';
import { Exam } from '@shared/types/Exam';
import { getExamString } from '../utils/utils';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampusdualService } from '../campusdual/campusdual.service';
import { generateExamResultImage } from '../utils/image_util';
import { isValidModuleCode } from '../utils/validators';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;
  private botDisabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly modulesService: ModulesService,
    private readonly groupsService: GroupsService,
    private readonly managerService: ManagerService,
    private readonly campusdualService: CampusdualService,
  ) {
    this.botDisabled = this.config.get<boolean>('DISABLE_BOT') || false;
    const botToken = this.config.get<string>('BOT_TOKEN')!;
    this.bot = new Telegraf(botToken);
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
    if (this.botDisabled) {
      this.logger.log('Bot disabled');
      return;
    }
    this.bot.launch();
    this.logger.log('Bot launched!');
  }

  onModuleDestroy() {
    this.bot.stop();
  }

  private deleteMessage(ctx: Context) {
    try {
      ctx.deleteMessage();
    } catch (e) {
      this.logger.error(e);
    }
  }

  private registerHandlers() {
    this.bot.start(async (ctx) => {
      await ctx.reply('Bot gestartet 🚀');
      this.deleteMessage(ctx);
    });

    this.bot.command('show', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) {
        await ctx.reply('Nicht bereit!');
        return;
      }
      try {
        const exams = await loadUser(chat.id);
        const examString =
          exams
            .map(getExamString)
            .map((examString) => `- ${examString}`)
            .join('\n') || 'Keine Prüfungen';

        await ctx.reply(
          `Du hast Benachrichtigung für die folgenden Prüfungen aktiviert:\n${examString}`,
        );
      } catch (error) {
        this.logger.error(
          `Benachrichtigungen konnten nicht geladen werden\n${error}`,
        );
        await ctx.reply('Benachrichtigungen konnten nicht geladen werden!');
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
      buttons.push([
        Markup.button.callback('Anderes', 'ADD_MODULE_CODE:CUSTOM'),
      ]);
      const inlineKeyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply(`Wähle ein Modul aus:`, inlineKeyboard);

      this.deleteMessage(ctx);
    });

    this.bot.action(/ADD_MODULE_CODE:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.ADD_SEMINAR_GROUP_ID_SET) return;
      if (ctx.match[1] === 'CUSTOM') {
        ctx.reply(
          'Gebe den Modulcode, genau wie er auf Campus Dual steht, ein: (z.B. 5CS-PT1-00)',
        );
        try {
          ctx.deleteMessage();
        } catch (e) {
          this.logger.error(e);
        }
        return;
      }
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

      this.deleteMessage(ctx);
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

      this.deleteMessage(ctx);
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
      try {
        const exams = await loadUser(chat.id);
        exams.push(exam);
        await saveUser(chat.id, exams);
        const text = `Benarichtigungen für die Prüfung ${getExamString(exam)} aktiviert.`;
        await ctx.reply(text);
      } catch (error) {
        this.logger.error(
          `Benarichtigung konnte nicht gespeichert werden\n${error}`,
        );
        await ctx.reply('Benarichtigung konnte nicht gespeichert werden!');
      }

      this.deleteMessage(ctx);
    });

    this.bot.command('remove', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) {
        await ctx.reply('Nicht bereit!');
        return;
      }

      try {
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
      } catch (error) {
        this.logger.error(
          `Benachrichtigungen konnten nicht geladen werden\n${error}`,
        );
        await ctx.reply('Benachrichtigungen konnten nicht geladen werden!');
      }
    });

    this.bot.action(/REMOVE_USER_MODULE:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) return;
      const examString = ctx.match[1];

      try {
        let exams = await loadUser(chat.id);
        exams = exams.filter((exam) => examString !== getExamString(exam));
        await saveUser(chat.id, exams);
        await ctx.reply(
          `Benarichtigungen für die Prüfung ${examString} deaktiviert!`,
        );
      } catch (error) {
        this.logger.error(
          `Benachrichtigung konnte nicht deaktiviert werden\n${error}`,
        );
        await ctx.reply('Benachrichtigung konnte nicht deaktiviert werden!');
      }

      this.deleteMessage(ctx);
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
    });

    this.bot.action(/CLEAR_USER_MODULES:(.+)/, async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.READY) return;
      const confirmed = ctx.match[1];
      if (confirmed === 'CONFIRM') {
        try {
          await saveUser(chat.id, []);
          await ctx.reply(`Benarichtigungen für alle Prüfungen deaktiviert!`);
        } catch (error) {
          this.logger.error(
            `Benachrichtigungen konnten nicht gelöscht werden\n${error}`,
          );
          await ctx.reply('Benachrichtigungen konnten nicht gelöscht werden!');
        }
      } else {
        await ctx.reply('Abgebrochen!');
      }

      this.deleteMessage(ctx);
    });

    this.bot.command('cancel', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state === StateEnum.READY) {
        ctx.reply('Schon bereit!');
      } else {
        chat.setReady();
        ctx.reply('Abgebrochen!');
      }
    });

    this.bot.on('text', async (ctx) => {
      const chat = this.managerService.load(ctx);
      if (chat.state !== StateEnum.ADD_SEMINAR_GROUP_ID_SET) return;

      const moduleCode = ctx.message.text.trim();
      if (!isValidModuleCode(moduleCode)) {
        await ctx.reply(
          'Ungültiger Modulcode! Gib erneut einen Modulcode ein:',
        );
        try {
          ctx.deleteMessage();
        } catch (e) {
          this.logger.error(e);
        }
        return;
      }

      const buttons = [
        Markup.button.callback('Bestätigen', `ADD_MODULE_CODE:${moduleCode}`),
        Markup.button.callback('Abbrechen', 'ADD_MODULE_CODE:CUSTOM'),
      ];
      const inlineKeyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply(
        `Bestätige das Modul ${moduleCode} auszuwählen:`,
        inlineKeyboard,
      );

      this.deleteMessage(ctx);
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    if (this.botDisabled) return;
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
