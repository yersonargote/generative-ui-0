import { createAnthropic } from '@ai-sdk/anthropic'
import { OpenAI } from '@ai-sdk/openai'
import {
  CoreMessage,
  ToolCallPart,
  ToolResultPart,
  streamText as nonexperimental_streamText
} from 'ai'
import { z } from 'zod'

var plantumlEncoder = require('plantuml-encoder')

export async function uml(context: string) {
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
  let hasError = false
  const messages: CoreMessage[] = []
  const toolCalls: ToolCallPart[] = []
  const toolResponses: ToolResultPart[] = []

  messages.push({ role: 'user', content: context })

  const result = await nonexperimental_streamText({
    model:
      process.env.SPECIFIC_PROVIDER === 'anthropic'
        ? anthropic!(
            process.env.SPECIFIC_API_MODEL || 'claude-3-haiku-20240307'
          )
        : openai!.chat(process.env.SPECIFIC_API_MODEL || 'llama3-70b-8192'),
    maxTokens: 2500,
    system: `You are a UML diagram generator in PlantUML format. Please generate the plantUML code for the code or object-oriented problem or text provide.
    Only provide the code of the model. If the is a class diagram always add to "skinparam classAttributeIconSize 0".
    - Always call the generatePlantUMLImageURL tool to generate the image URL from the PlantUML code.
    - Always answer in Markdown format. Links and images must follow the correct format.
    Link format: [link text](url)
    Image format: ![alt text](url)
    `,
    tools: {
      generatePlantUMLImageURL: {
        description: 'Generate PlantUML image URL from PlantUML code',
        parameters: z.object({
          plantUMLCode: z
            .string()
            .describe('PlantUML code to generate image URL')
        }),
        execute: async ({ plantUMLCode }: { plantUMLCode: string }) => {
          return generatePlantUMLImageURL(plantUMLCode)
        }
      }
    },
    messages
  })

  for await (const delta of result.fullStream) {
    switch (delta.type) {
      case 'tool-call': {
        toolCalls.push(delta)
        break
      }
      case 'tool-result': {
        toolResponses.push(delta)
        break
      }
      case 'error':
        hasError = true
        fullResponse += `\nError ocurred while executing the tool: ${delta.error}`
        break
    }
  }

  messages.push({
    role: 'assistant',
    content: [{ type: 'text', text: fullResponse }, ...toolCalls]
  })

  if (toolResponses.length > 0) {
    messages.push({ role: 'tool', content: toolResponses })
  }

  return { toolResponses }
}

async function generatePlantUMLImageURL(plantUMLCode: string) {
  const URL = 'https://www.plantuml.com/plantuml/svg/'
  const encoded = plantumlEncoder.encode(plantUMLCode)
  const newImgUrl = `${URL}${encoded}`
  return newImgUrl
}
