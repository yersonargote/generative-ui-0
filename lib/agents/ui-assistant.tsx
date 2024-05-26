import { CodeEditor } from '@/components/code-editor'
import { Section } from '@/components/section'
import { YoutubeVideo } from '@/components/youtube'
import { CoreMessage, ToolCallPart, ToolResultPart, streamText } from 'ai'
import { createStreamableUI } from 'ai/rsc'
import { z } from 'zod'
import { getModel } from '../utils'

export async function uiAssistant(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  'use server'

  const result = await streamText({
    model: getModel(),
    system:
      'You are chatting with an AI assistant. The assistant is helpful, creative, clever, and very friendly.',
    messages: messages,
    tools: {
      youtube: {
        description: 'Show a YouTube videos',
        parameters: z.object({
          ids: z.array(
            z.object({
              id: z.string().describe('The YouTube video ID')
            })
          )
        }),
        execute: async function ({ ids }) {
          uiStream.update(
            <Section title="Videos">
              {ids.map(({ id }: { id: string }) => (
                <YoutubeVideo key={id} id={id} />
              ))}
            </Section>
          )
          return { ids: ids }
        }
      },
      code: {
        description: 'Show the code in a code editor',
        parameters: z.object({
          snippets: z.array(
            z.object({
              language: z.string().describe('The language of the code'),
              code: z.string().describe('The code to display')
            })
          )
        }),
        execute: async function ({
          snippets
        }: {
          snippets: { language: string; code: string }[]
        }) {
          uiStream.update(
            <Section title="Código">
              {snippets.map(
                ({ language, code }: { language: string; code: string }) => (
                  <CodeEditor key={code} code={code} language={language} />
                )
              )}
            </Section>
          )
          return { snippets: snippets }
        }
      }
    }
  })

  const toolCalls: ToolCallPart[] = []
  const toolResponses: ToolResultPart[] = []
  const reader = result.fullStream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    switch (value?.type) {
      case 'tool-call':
        toolCalls.push(value)
        break
      case 'tool-result':
        toolResponses.push(value)
        break
    }
    if (done) {
      break
    }
  }

  return { toolResponses }
}
