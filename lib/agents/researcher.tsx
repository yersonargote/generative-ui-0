import { BotMessage } from '@/components/message'
import { Section } from '@/components/section'
import {
  CoreMessage,
  ToolCallPart,
  ToolResultPart,
  streamText as nonexperimental_streamText
} from 'ai'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { getModel } from '../utils'
import { getTools } from './tools'

export async function researcher(
  uiStream: ReturnType<typeof createStreamableUI>,
  streamText: ReturnType<typeof createStreamableValue<string>>,
  messages: CoreMessage[],
  useSpecificModel?: boolean
) {
  let fullResponse = ''
  let hasError = false
  const answerSection = (
    <Section title="Respuesta">
      <BotMessage content={streamText.value} />
    </Section>
  )

  let isFirstToolResponse = true
  const currentDate = new Date().toLocaleString()
  const result = await nonexperimental_streamText({
    model: getModel(),
    maxTokens: 2500,
    system: `As a professional expert in the search for programming concepts, you possess the ability to search for any programming-related information on the web.
- Answer only programming questions.
- Always search the web for information.
- If the user's query pertains to programming or requires additional programming context, utilize search engines to find the most relevant information to provide a detailed and accurate response.
- For each programming query, leverage the search results comprehensively to provide additional information and assistance.
- If there are any images relevant to your answer, be sure to include them as well.
- If code snippets are necessary, use Java.
- Directly address the user's programming question and support your response with insights obtained from the search results.
- Whenever quoting or referencing information from a specific URL related to programming, cite the source URL explicitly.
- Please match the language of the response to the user's language. 

Current date and time: ${currentDate}`,
    // system: `As a professional programming search expert, you possess the ability to search for any programming-related information on the web.

    // - Answer only programming questions.
    // - If the user's query is a programming question or requires additional programming context, you can use search engines to find the most relevant information to provide a comprehensive answer.
    // - For each programming query, utilize the search results to their fullest potential to provide additional information and assistance in your response.
    // - If there are any code snippets required, use only Java.
    // - Aim to directly address the user's programming question, augmenting your response with insights gleaned from the search results.
    // - Whenever quoting or referencing information from a specific URL related to programming, always cite the source URL explicitly.
    // - Please match the language of the response to the user's language. Current date and time: ${currentDate}`,
    // system: `As a professional programming search expert, you possess the ability to search for any information on the web.
    // If the user's query is a question or requires additional context, you can use search engines to find the most relevant information to provide a comprehensive answer.
    // For each user query, utilize the search results to their fullest potential to provide additional information and assistance in your response.
    // If there are any images relevant to your answer, be sure to include them as well.
    // If you need show code snippets use only Java.
    // Aim to directly address the user's question, augmenting your response with insights gleaned from the search results.
    // Whenever quoting or referencing information from a specific URL, always cite the source URL explicitly.
    // Please match the language of the response to the user's language. Current date and time: ${currentDate}`,
    messages,
    tools: getTools({
      uiStream,
      fullResponse,
      isFirstToolResponse
    })
  })

  // Process the response
  const toolCalls: ToolCallPart[] = []
  const toolResponses: ToolResultPart[] = []
  for await (const delta of result.fullStream) {
    switch (delta.type) {
      case 'text-delta':
        if (delta.textDelta) {
          // If the first text delta is available, add a UI section
          if (fullResponse.length === 0 && delta.textDelta.length > 0) {
            // Update the UI
            uiStream.update(answerSection)
          }

          fullResponse += delta.textDelta
          streamText.update(fullResponse)
        }
        break
      case 'tool-call':
        toolCalls.push(delta)
        break
      case 'tool-result':
        // Append the answer section if the specific model is not used
        if (!useSpecificModel && toolResponses.length === 0 && delta.result) {
          uiStream.append(answerSection)
        }
        if (!delta.result) {
          hasError = true
        }
        toolResponses.push(delta)
        break
      case 'error':
        hasError = true
        fullResponse += `\nError occurred while executing the tool`
        break
    }
  }
  messages.push({
    role: 'assistant',
    content: [{ type: 'text', text: fullResponse }, ...toolCalls]
  })

  if (toolResponses.length > 0) {
    // Add tool responses to the messages
    messages.push({ role: 'tool', content: toolResponses })
  }

  return { result, fullResponse, hasError, toolResponses }
}
