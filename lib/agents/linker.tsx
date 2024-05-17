import { BotMessage } from '@/components/message'
import { Section } from '@/components/section'
import { createAnthropic } from '@ai-sdk/anthropic'
import { OpenAI } from '@ai-sdk/openai'
import { CoreMessage, streamText as nonexperimental_streamText } from 'ai'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'

export async function linker(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  var openai, anthropic
  if (process.env.SPECIFIC_PROVIDER === 'anthropic') {
    anthropic = createAnthropic({
      baseUrl: process.env.SPECIFIC_API_BASE,
      apiKey: process.env.SPECIFIC_API_KEY
    })
  } else {
    openai = new OpenAI({
      baseUrl: process.env.SPECIFIC_API_BASE,
      apiKey: process.env.SPECIFIC_API_KEY,
      organization: '' // optional organization
    })
  }
  let fullResponse = ''
  const streamText = createStreamableValue<string>('')
  const answerSection = (
    <Section title="Respuesta">
      <BotMessage content={streamText.value} />
    </Section>
  )
  uiStream.append(answerSection)

  await nonexperimental_streamText({
    model:
      process.env.SPECIFIC_PROVIDER === 'anthropic'
        ? anthropic!(
            process.env.SPECIFIC_API_MODEL || 'claude-3-haiku-20240307'
          )
        : openai!.chat(process.env.SPECIFIC_API_MODEL || 'llama3-70b-8192'),
    maxTokens: 2500,
    system: `
    You are Markdown renderer. Please generate the Markdown code for the image or link provided.
    Links and images must follow the correct format.
    Link format: [link text](url)
    Image format: ![alt text](url)
    - Please match the language of the response to the user's language. 
    `,
    messages
  })
    .then(async result => {
      for await (const text of result.textStream) {
        if (text) {
          fullResponse += text
          streamText.update(fullResponse)
        }
      }
    })
    .finally(() => {
      streamText.done()
    })

  return fullResponse
}
