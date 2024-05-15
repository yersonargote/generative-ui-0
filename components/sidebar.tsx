import { getChats } from '@/lib/actions/chat'
import { cache } from 'react'
import { History } from './history'

const loadChats = cache(async (userId?: string) => {
  return await getChats(userId)
})

export async function Sidebar() {
  const chats = await loadChats('anonymous')
  console.log('history loaded')
  return (
    <div className="h-screen p-2 fixed top-0 right-0 flex-col justify-center pb-24 hidden sm:flex">
      <History location="sidebar" chats={chats} />
    </div>
  )
}
