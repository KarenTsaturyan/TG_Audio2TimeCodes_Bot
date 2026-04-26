import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { OPENAI_API } from 'src/constants'
import {
	buildTimestampUserPrompt,
	TIMESTAMP_SYSTEM_PROMPT,
} from 'src/prompts/timecode.prompt'

interface IOpenAIResponse {
	choices: {
		message: {
			content: string
		}
	}[]
	usage: {
		prompt_tokens: number
		completion_tokens: number
	}
}

@Injectable()
export class AiService {
	private readonly openApiKey: string

	constructor(private readonly configService: ConfigService) {
		this.openApiKey = configService.getOrThrow<string>('OPENAI_KEY')
	}

	async generateTimeCodes(
		transcription: string,
		audioDuration,
	): Promise<{
		timeCodes: string
		cost: string
	}> {
		const maxSegments = 10

		const words = transcription.split(/\s+/)
		const wordsPerSegment = Math.ceil(words.length / maxSegments)
		const secondsPerSegment = Math.floor(audioDuration / maxSegments)

		const segments: { time: string; content: string }[] = []

		for (let i = 0; i < maxSegments; i++) {
			const fromSec = i * secondsPerSegment
			const fromMin = String(Math.floor(fromSec / 60)).padStart(2, '0')
			const fromSecRest = String(fromSec % 60).padStart(2, '0')
			const time = `${fromMin}:${fromSecRest}`

			const start = i * wordsPerSegment
			const end = start + wordsPerSegment
			const content = words.slice(start, end).join(' ')
			if (content.trim()) {
				segments.push({ time, content })
			}
		}

		// INFO: time is not used but can be included in the prompt if needed for better time code generation
		const preparedText = segments.map(({ content }) => content).join('\n')

		const systemMessage = TIMESTAMP_SYSTEM_PROMPT
		const userMessage = buildTimestampUserPrompt(preparedText)

		const res = await axios.post<IOpenAIResponse>(
			`${OPENAI_API}/chat/completions`,
			{
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: systemMessage,
					},
					{
						role: 'user',
						content: userMessage,
					},
				],
				temperature: 0.3, // Creativity level
				max_tokens: 300,
			},
			{
				headers: {
					Authorization: `Bearer ${this.openApiKey}`,
				},
			},
		)

		const result = res.data.choices[0]?.message.content
		const usage = res.data.usage

		const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15
		const outputCost = (usage.completion_tokens / 1_000_000) * 0.6
		const totalCost = inputCost + outputCost

		const costText = `Generation cost: $${totalCost.toFixed(4)}`

		return { timeCodes: result, cost: costText }
	}
}
