import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { OPENAI_API, TG_API } from '../constants'
import FormData from 'form-data'

@Injectable()
export class SpeechService {
	private readonly botToken: string
	private readonly openApiKey: string

	constructor(private readonly configService: ConfigService) {
		this.botToken = configService.getOrThrow<string>('TG_BOT_TOKEN')
		this.openApiKey = configService.getOrThrow<string>('OPENAI_KEY')
	}

	async transcribeVoice(filePath: string): Promise<string> {
		const fileUrl = `${TG_API}/file/bot${this.botToken}/${filePath}`
		const fileResponse = await axios.get(fileUrl, {
			// streaming the file directly to OpenAI without saving it locally
			responseType: 'stream',
		})

		const formData = new FormData()
		formData.append('file', fileResponse.data, { filename: 'audio.ogg' })
		formData.append('model', 'whisper-1')

		const res = await axios.post<{ text: string }>(
			`${OPENAI_API}/audio/transcriptions`,
			formData,
			{
				headers: {
					Authorization: `Bearer ${this.openApiKey}`,
					...formData.getHeaders(),
				},
			},
		)

		return res.data.text
	}
}
