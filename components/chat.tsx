'use client'

import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { AIMessage, Session } from '@/lib/types'
import { useAIState, useUIState } from 'ai/rsc'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'

type ChatProps = {
  initialMessages?: AIMessage[]
  id?: string
  session?: Session
  missingKeys?: string[]
}

export function Chat({ id, session, missingKeys }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [messages] = useUIState()
  const [aiState] = useAIState()

  const [_, setNewSearchId] = useLocalStorage('newSearchId', id)

  useEffect(() => {
    if (!path.includes('search') && messages.length === 1) {
      window.history.replaceState({}, '', `/search/${id}`)
    }
  }, [id, path, session?.user, messages])

  useEffect(() => {
    if (aiState.messages[aiState.messages.length - 1]?.type === 'followup') {
      // Refresh the page to chat history updates
      router.refresh()
    }
  }, [aiState, router])

  useEffect(() => {
    setNewSearchId(id)
  })

  useEffect(() => {
    missingKeys?.map(key => {
      toast.error(`Missing key: ${key}`)
    })
  }, [missingKeys])

  return (
    <div className="px-8 sm:px-12 pt-12 md:pt-14 pb-14 md:pb-24 max-w-3xl mx-auto flex flex-col space-y-3 md:space-y-4">
      <ChatMessages messages={messages} />
      <ChatPanel messages={messages} />
    </div>
  )
}
