import { BotMessage } from '@/components/message'
import { Section } from '@/components/section'
import { CoreMessage, streamText as nonexperimental_streamText } from 'ai'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { getModel } from '../utils'

export async function writer(
  uiStream: ReturnType<typeof createStreamableUI>,
  streamText: ReturnType<typeof createStreamableValue<string>>,
  messages: CoreMessage[]
) {
  let fullResponse = ''
  const answerSection = (
    <Section title="Respuesta">
      <BotMessage content={streamText.value} />
    </Section>
  )
  uiStream.append(answerSection)

  await nonexperimental_streamText({
    model: getModel(),
    maxTokens: 2500,
    system: `As a professional writer, your job is to generate a comprehensive and informative, yet concise answer of 400 words or less for the given question based solely on the provided search results (URL and content). You must only use information from the provided search results. Use an unbiased and journalistic tone. Combine search results together into a coherent answer. Do not repeat text. If there are any images relevant to your answer, be sure to include them as well. Aim to directly address the user's question, augmenting your response with insights gleaned from the search results. 
    Whenever quoting or referencing information from a specific URL, always cite the source URL explicitly. Please match the language of the response to the user's language.
    Always answer in Markdown format. Links and images must follow the correct format.
    Link format: [link text](url)
    Image format: ![alt text](url)
    Always show an example of the concept using java code.
    Always show an example of the concept based in the search results using mermaid code.
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
