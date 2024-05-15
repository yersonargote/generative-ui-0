'use server'

import { CoreMessage, nanoid } from 'ai'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import OpenAI from 'openai'

var plantumlEncoder = require('plantuml-encoder')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

let THREAD_ID = ''
let RUN_ID = ''
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || ''

export async function pooAssistant(
  uiStream: ReturnType<typeof createStreamableUI>,
  streamText: ReturnType<typeof createStreamableValue<string>>,
  messages: CoreMessage[]
) {
  const lastMessage = messages[messages.length - 1]
  const question = JSON.parse(lastMessage.content as string)?.input
  let fullResponse = ''

  const runQueue = []

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
                    streamText.append(part.text.value)
                  }
                }
              }
            })
          } else if (event === 'thread.run.requires_action') {
            if (data.required_action?.type === 'submit_tool_outputs') {
              const tool_outputs =
                data.required_action.submit_tool_outputs.tool_calls.map(
                  (toolCall: any) => {
                    const parameters = JSON.parse(toolCall.function.arguments)
                    switch (toolCall.function.name) {
                      case 'getImageURL':
                      case 'obtenerURLImagen':
                        const plantUMLCode =
                          parameters.plantUMLCode ?? parameters.codigoPlantUML
                        const plantUMLUrl =
                          generatePlantUMLImageURL(plantUMLCode)
                        fullResponse = `${fullResponse}\n![Plant UML Diagram](${plantUMLUrl})`
                        streamText.append(
                          `\n![Plant UML Diagram](${plantUMLUrl})`
                        )
                        return {
                          tool_call_id: toolCall.id,
                          output: plantUMLUrl
                        }
                      default:
                        throw new Error(
                          `Unknown function name: ${toolCall.function.name}`
                        )
                    }
                  }
                )
              // tool_outputs.forEach((tool_output) => {
              //   text.append(`![Plant UML Diagram](${tool_output.output})`);
              // });
              await openai.beta.threads.runs.submitToolOutputs(
                THREAD_ID,
                RUN_ID,
                { tool_outputs }
              )
            }
          } else if (event === 'thread.run.failed') {
            console.log(`FAILED: ${JSON.stringify(data)}`)
          }
        }
      }
    }
  })()

  return fullResponse
}

function generatePlantUMLImageURL(plantUMLCode: string) {
  const URL = 'https://www.plantuml.com/plantuml/svg/'
  const encoded = plantumlEncoder.encode(plantUMLCode)
  const newImgUrl = `${URL}${encoded}`
  return newImgUrl
}
