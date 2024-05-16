import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Chat } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronLeft, History as HistoryIcon, Menu } from 'lucide-react'
import { ClearHistory } from './clear-history'
import HistoryItem from './history-item'

type HistoryProps = {
  location: 'sidebar' | 'header'
  chats: Chat[]
}

export function History({ location, chats }: HistoryProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn({
            'rounded-full text-foreground/30': location === 'sidebar'
          })}
        >
          {location === 'header' ? <Menu /> : <ChevronLeft size={16} />}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-64 rounded-tl-xl rounded-bl-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1 text-sm font-normal mb-2">
            <HistoryIcon size={14} />
            Historial
          </SheetTitle>
        </SheetHeader>
        <div className="my-2 overflow-y-auto h-[calc(100vh-7.5rem)]">
          {!chats?.length ? (
            <div className="text-foreground/30 text-sm text-center py-4">
              No hay historial de búsqueda
            </div>
          ) : (
            chats?.map(
              (chat: Chat) => chat && <HistoryItem key={chat.id} chat={chat} />
            )
          )}
        </div>
        <SheetFooter>
          <ClearHistory empty={!chats?.length} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
