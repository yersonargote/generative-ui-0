import { auth } from '@/auth'
import { Chat } from '@/components/chat'
import { getMissingKeys } from '@/lib/actions/chat'
import { Session } from '@/lib/types'
import { nanoid } from 'ai'
import { AI } from './actions'

export const maxDuration = 60

export default async function Page() {
  const id = nanoid()
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      <Chat id={id} missingKeys={missingKeys} session={session} />
    </AI>
  )
}
