import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { History } from './history'

export async function Sidebar() {
  const session = (await auth()) as Session
  const userId = session?.user?.id || 'anonymous'
  return (
    <div className="h-screen p-2 fixed top-0 right-0 flex-col justify-center pb-24 hidden sm:flex">
      <History location="sidebar" userId={userId} />
    </div>
  )
}
