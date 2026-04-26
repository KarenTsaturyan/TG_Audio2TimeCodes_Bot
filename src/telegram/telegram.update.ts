import { On, Start, Update } from '@grammyjs/nestjs'
import { Injectable } from '@nestjs/common'
import { Context } from 'grammy'
import { TelegramService } from './telegram.service'

@Update()
@Injectable()
export class TelegramUpdate {
	constructor(private readonly telegramService: TelegramService) {}

	@Start()
	async onStart(ctx: Context): Promise<void> {
		await ctx.reply(
			'Hello! I am bot who can generate time codes for voice chats. Just send me a voice message and I will reply with the time code.',
		)
	}

	@On('message:voice')
	async onVoiceMessage(ctx: Context): Promise<void> {
		return this.telegramService.processVoiceMessage(ctx)
	}
}
