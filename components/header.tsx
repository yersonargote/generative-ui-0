import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { Session } from '@/lib/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import HistoryContainer from './history-container'
import { ModeToggle } from './mode-toggle'
import { IconLogo } from './ui/icons'
import { UserMenu } from './user-menu'

export const Header: React.FC = async () => {
  const session = (await auth()) as Session
  const userId = session?.user?.id || 'anonymous'
  return (
    <header className="fixed w-full p-1 md:p-2 flex justify-between items-center z-10 backdrop-blur md:backdrop-blur-none bg-background/80 md:bg-transparent">
      <div>
        <a href="/">
          <IconLogo className={cn('w-5 h-5')} />
          <span className="sr-only">Morphic</span>
        </a>
        {userId === 'anonymous' ? (
          <Button variant="link" asChild>
            <Link href="/login">Login</Link>
          </Button>
        ) : (
          <UserMenu user={session.user} />
        )}
      </div>
      <div className="flex gap-0.5">
        <ModeToggle />
        <HistoryContainer location="header" userId={userId} />
      </div>
    </header>
  )
}

export default Header
