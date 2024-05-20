import { AI } from '@/app/actions'
import { auth } from '@/auth'
import { Chat } from '@/components/chat'
import { getChat, getMissingKeys } from '@/lib/actions/chat'
import { Session } from '@/lib/types'
import { notFound, redirect } from 'next/navigation'

export const maxDuration = 60

export interface SearchPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: SearchPageProps) {
  const session = await auth()

  const userId =
    session && session.user ? (session.user.id as string) : 'anonymous'

  const chat = await getChat(params.id, userId)
  return {
    title: chat?.title.toString().slice(0, 50) || 'Search'
  }
}

export default async function SearchPage({ params }: SearchPageProps) {
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  const userId = session?.user?.id || 'anonymous'

  const chat = await getChat(params.id, userId)

  if (!chat) {
    redirect('/')
  }

  if (chat?.userId !== userId) {
    notFound()
  }

  return (
    <AI
      initialAIState={{
        chatId: chat.id,
        messages: chat.messages
      }}
    >
      <Chat
        id={params.id}
        session={session}
        initialMessages={chat.messages}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
