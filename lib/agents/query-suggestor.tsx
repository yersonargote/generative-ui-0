import SearchRelated from '@/components/search-related'
import { Section } from '@/components/section'
import { PartialRelated, relatedSchema } from '@/lib/schema/related'
import { OpenAI } from '@ai-sdk/openai'
import { CoreMessage, streamObject } from 'ai'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'

export async function querySuggestor(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  const openai = new OpenAI({
    baseUrl: process.env.OPENAI_API_BASE, // optional base URL for proxies etc.
    apiKey: process.env.OPENAI_API_KEY, // optional API key, default to env property OPENAI_API_KEY
    organization: '' // optional organization
  })
  const objectStream = createStreamableValue<PartialRelated>()
  uiStream.append(
    <Section title="Related" separator={true}>
      <SearchRelated relatedQueries={objectStream.value} />
    </Section>
  )

  let finalRelatedQueries: PartialRelated = {}
  await streamObject({
    model: openai.chat(process.env.OPENAI_API_MODEL || 'gpt-4o'),
    system: `As a professional web researcher, your task is to generate a set of three queries that explore the subject matter more deeply, building upon the initial query and the information uncovered in its search results.
    Please match the language of the response to the user's language. 
    - What is object-oriented programming?
      "{
        "related": [
          "What are the main principles of object-oriented programming?",
          "How does object-oriented programming differ from procedural programming?",
          "What are the advantages and disadvantages of object-oriented programming?"
        ]
      }"
    - What is a class?
      "{
        "related": [
          "How is a class defined in object-oriented programming?",
          "What are the core components of a class in Java?",
          "How do classes promote reusability in object-oriented programming?"
        ]
      }"
    - What is an attribute?
      "{
        "related": [
          "How are attributes defined and used in a class?",
          "What are the differences between class attributes and instance attributes?",
          "How do attributes interact with methods in a class?"
        ]
      }"
    - What is a method?
      "{
        "related": [
          "How are methods defined in a class?",
          "What is the purpose of a method signature?",
          "How do methods enhance encapsulation in a class?"
        ]
      }"
    - What  is an object?
    "{
      "related": [
        "How is an object instantiated from a class?",
        "What are some real-world examples of objects in programming?",
        "How do objects interact with each other in an object-oriented system?"
      ]
    }"
  - What is an association relationship?
    "{
      "related": [
        "What is an association relationship in object-oriented programming?",
        "How is an association relationship represented in UML diagrams?",
        "What are the different types of association relationships?"
      ]
    }"
  - What is a dependency relationship?
    "{
      "related": [
        "What is a dependency relationship in object-oriented programming?",
        "How can dependency injection be used to manage dependency relationships?",
        "What are the consequences of having tight coupling in dependency relationships?"
      ]
    }"
  - What is aggregation?
    "{
      "related": [
        "What is aggregation in object-oriented programming and how is it represented?",
        "How does aggregation differ from composition?",
        "What are some examples of aggregation in software design?"
      ]
    }"
  - What is composition?
    "{
      "related": [
        "What is composition in object-oriented programming and how is it represented?",
        "How does composition strengthen the relationship between objects?",
        "What are the benefits of using composition over inheritance?"
      ]
    }"
  - What is inheritance?
    "{
      "related": [
        "What is inheritance in object-oriented programming and how is it used?",
        "How does inheritance promote code reuse?",
        "What are the common pitfalls of using inheritance?"
      ]
    }"
  - What is polymorphism?
    "{
      "related": [
        "What is polymorphism and how does it work in object-oriented programming?",
        "How does polymorphism enhance flexibility in software design?",
        "What are the different types of polymorphism in Java?"
      ]
    }"`,
    // system: `As a professional web researcher, your task is to generate a set of three queries that explore the subject matter more deeply, building upon the initial query and the information uncovered in its search results.

    // For instance, if the original query was "Starship's third test flight key milestones", your output should follow this format:

    // "{
    //   "related": [
    //     "What were the primary objectives achieved during Starship's third test flight?",
    //     "What factors contributed to the ultimate outcome of Starship's third test flight?",
    //     "How will the results of the third test flight influence SpaceX's future development plans for Starship?"
    //   ]
    // }"

    // Aim to create queries that progressively delve into more specific aspects, implications, or adjacent topics related to the initial query. The goal is to anticipate the user's potential information needs and guide them towards a more comprehensive understanding of the subject matter.
    // Please match the language of the response to the user's language.`,
    messages,
    schema: relatedSchema
  })
    .then(async result => {
      for await (const obj of result.partialObjectStream) {
        if (obj.items) {
          objectStream.update(obj)
          finalRelatedQueries = obj
        }
      }
    })
    .finally(() => {
      objectStream.done()
    })

  return finalRelatedQueries
}
