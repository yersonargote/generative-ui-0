'use server'

import { BotMessage } from '@/components/message'
import { Section } from '@/components/section'
import { CoreMessage, nanoid } from 'ai'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

let THREAD_ID = ''
let RUN_ID = ''
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID_RESOURCES || ''

export async function resources(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  let question
  if (messages.length > 0 && messages.length % 2 === 0) {
    const userMessage = messages[messages.length - 2]
    question = userMessage.content as string
  } else {
    const userMessage = messages[messages.length - 1]
    question = userMessage.content as string
  }
  let fullResponse = ''

  const runQueue = []
  const textStream = createStreamableValue<string>()

  uiStream.append(
    <Section title="Respuesta" separator={true}>
      <BotMessage content={textStream.value} />
    </Section>
  )

  await (async () => {
    if (THREAD_ID) {
      await openai.beta.threads.messages.create(THREAD_ID, {
        role: 'user',
        content: question
      })

      const run = await openai.beta.threads.runs.create(THREAD_ID, {
        assistant_id: ASSISTANT_ID,
        stream: true
      })

      runQueue.push({ id: nanoid(), run })
    } else {
      const run = await openai.beta.threads.createAndRun({
        assistant_id: ASSISTANT_ID,
        stream: true,
        thread: {
          messages: [{ role: 'user', content: question }]
        }
      })

      runQueue.push({ id: nanoid(), run })
    }

    while (runQueue.length > 0) {
      const latestRun = runQueue.shift()

      if (latestRun) {
        for await (const delta of latestRun.run) {
          const { data, event } = delta

          if (event === 'thread.created') {
            THREAD_ID = data.id
          } else if (event === 'thread.run.created') {
            RUN_ID = data.id
          } else if (event === 'thread.message.delta') {
            data.delta.content?.map(part => {
              if (part.type === 'text') {
                if (part.text) {
                  if (part.text.value) {
                    fullResponse = `${fullResponse}${part.text.value}`
                    textStream.append(part.text.value)
                  }
                }
              }
            })
          } else if (event === 'thread.run.failed') {
            console.log(`FAILED: ${JSON.stringify(data)}`)
          }
        }
      }
    }
  })().finally(() => {
    textStream.done()
  })

  return fullResponse
}
