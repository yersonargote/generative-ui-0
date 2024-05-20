import { AI } from '@/app/actions'
import { auth } from '@/auth'
import { Chat } from '@/components/chat'
import { getMissingKeys, getSharedChat } from '@/lib/actions/chat'
import { Session } from '@/lib/types'
import { notFound } from 'next/navigation'

export interface SharePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: SharePageProps) {
  const chat = await getSharedChat(params.id)

  if (!chat || !chat.sharePath) {
    return notFound()
  }

  return {
    title: chat?.title.toString().slice(0, 50) || 'Search'
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const chat = await getSharedChat(params.id)
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  if (!chat || !chat.sharePath) {
    notFound()
  }

  return (
    <AI
      initialAIState={{
        chatId: chat.id,
        messages: chat.messages,
        isSharePage: true
      }}
    >
      <Chat id={params.id} missingKeys={missingKeys} session={session} />
    </AI>
  )
}
