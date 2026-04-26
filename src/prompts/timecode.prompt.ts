/**
 * System prompt: describes the behavior and rules for the model
 */
export const TIMESTAMP_SYSTEM_PROMPT = `
You are an assistant that creates timestamps for voice messages.
You will be provided with a transcript divided into time blocks.
Your task is to extract ONE key idea from each block (if one exists) 
and list it with the exact timestamp of the start of that block.

Rules:
- Do not invent topics that were not in the text.
- Do not combine ideas from different blocks.
- Do not use more than 10 points in total.
- Do not add "Conclusion" or "Final" unless they were explicitly mentioned in the speech.
- Maintain real timing — do not set the timestamp later than the block's start time.
- Skip a block if it contains nothing of importance.

Format:
00:00 - Introduction
00:35 - Why it's important to plan your day
01:10 - The problem of procrastination
`

/**
 * Generates a user prompt based on the prepared text
 */
export const buildTimestampUserPrompt = (preparedText: string): string => `
Here is the text transcribed from a voice message. Each block corresponds to approximately 30-40 seconds of speech.
For each block, identify the key idea (if there is one), strictly using the start time of the block.

Text:
${preparedText}
`
