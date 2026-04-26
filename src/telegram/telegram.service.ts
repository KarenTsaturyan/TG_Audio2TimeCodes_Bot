import { Injectable } from '@nestjs/common'
import { InjectBot } from '@grammyjs/nestjs'
import { ConfigService } from '@nestjs/config'
import { Bot, Context } from 'grammy'
import { SpeechService } from 'src/services/speech.service'
import { AiService } from 'src/services/ai.service'

@Injectable()
export class TelegramService {
	private readonly botToken: string | undefined

	constructor(
		private readonly configService: ConfigService,
		@InjectBot() private readonly bot: Bot<Context>,
		private readonly speechService: SpeechService,
		private readonly aiService: AiService,
	) {
		this.botToken = configService.get<string>('TG_BOT_TOKEN')
	}

	async processVoiceMessage(ctx: Context): Promise<void> {
		const voice = ctx.msg?.voice
		const duration = voice?.duration

		let progressMessageId: number | undefined
		let interval: NodeJS.Timeout | undefined
		let percent = 10

		try {
			const file = await ctx.getFile()
			await ctx.reply(`Your voice message duration is ${duration}sec.`)

			const progressMsg = await ctx.reply(this.renderProgress(percent))
			progressMessageId = progressMsg.message_id

			interval = setInterval(
				async () => {
					if (percent < 90) {
						percent += 5
						await this.updateProgress(
							ctx,
							ctx.chat?.id,
							progressMessageId,
							percent,
						)
					}
				},
				duration > 300 ? 3000 : 2000,
			)

			const transcription = await this.speechService.transcribeVoice(
				file.file_path,
			)

			const { cost, timeCodes } = await this.aiService.generateTimeCodes(
				transcription,
				duration,
			)

			clearInterval(interval)
			await this.updateProgress(ctx, ctx.chat?.id, progressMessageId, 100)
			await ctx.reply(`Time codes:\n${timeCodes}\n\nCost: ${cost}`)
		} catch (error) {
			clearInterval(interval)
			console.error('Error processing voice message:', error)
			await ctx.reply(
				'Sorry, something went wrong while processing your voice message.',
			)
		}
	}

	private async updateProgress(
		ctx: Context,
		chatId: number,
		messageId: number,
		percent: number,
	) {
		await ctx.api.editMessageText(
			chatId,
			messageId,
			this.renderProgress(percent),
		)
	}

	private renderProgress(percent: number): string {
		const totalBalance = 10
		const blockChar = '█'
		const emptyChar = '░'

		const bars = Math.max(1, Math.round((percent / 100) * totalBalance))
		const emptyBlocks = totalBalance - bars

		return `Processing: ${percent}% [${blockChar.repeat(bars)}${emptyChar.repeat(emptyBlocks)}]`
	}
}
