import { Section } from '@/components/section'
import { YoutubeVideo } from '@/components/youtube'
import { CoreMessage, ToolCallPart, ToolResultPart, streamText } from 'ai'
import { createStreamableUI } from 'ai/rsc'
import { z } from 'zod'
import { getModel } from '../utils'

export async function assistant(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  let fullResponse = ''
  let hasError = false
  const result = await streamText({
    model: getModel(),
    system: `As a professional assistant, you are responsible for providing support and guidance to users in various tasks.
    - Show YouTube videos to enhance the user's understanding of the topic, take the youtbe links in the context and call 'getIdYoutubeVideo' function.
    Examples:
    - For https://youtu.be/mr3z4pIzUns?si=jRpvo-_wIFldLKyR, the video id is mr3z4pIzUns.
    - For https://www.youtube.com/watch?v=mr3z4pIzUns, the video id is mr3z4pIzUns.
    `,
    messages: messages,
    tools: {
      getIdYoutubeVideo: {
        description: 'Show a YouTube video',
        parameters: z.object({
          id: z.string().describe('The YouTube video ID')
        }),
        execute: async ({ id }) => {
          uiStream.append(
            <Section title="Respuesta">
              <YoutubeVideo id={id} />
            </Section>
          )
          return id
        }
      }
    }
  })

  const toolCalls: ToolCallPart[] = []
  const toolResponses: ToolResultPart[] = []
  for await (const delta of result.fullStream) {
    switch (delta.type) {
      case 'tool-call':
        toolCalls.push(delta)
        break
      case 'tool-result':
        toolResponses.push(delta)
        break
      case 'error':
        hasError = true
        fullResponse += `\nError occurred while executing the tool`
        break
    }
  }

  if (toolResponses.length > 0) {
    messages.push({ role: 'tool', content: toolResponses })
  }

  return { toolCalls, toolResponses, hasError }
}
