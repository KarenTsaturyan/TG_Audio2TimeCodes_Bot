import { NestjsGrammyModule } from '@grammyjs/nestjs'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TelegramUpdate } from './telegram.update'
import { TelegramService } from './telegram.service'
import { SpeechService } from 'src/services/speech.service'
import { AiService } from 'src/services/ai.service'

@Module({
	imports: [
		ConfigModule,
		NestjsGrammyModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				token: configService.getOrThrow<string>('TG_BOT_TOKEN'),
			}),
		}),
	],
	providers: [TelegramUpdate, TelegramService, SpeechService, AiService],
})
export class TelegramModule {}
