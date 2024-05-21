'use server'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import { Redis } from '@upstash/redis'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
})

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = redis.pipeline()
    const chats: string[] = await redis.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true
    })

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string = 'anonymous') {
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function clearChats(userId: string = 'anonymous') {
  const session = await auth()
  const targetUserId = session?.user?.id || userId

  const chats: string[] = await redis.zrange(`user:chat:${targetUserId}`, 0, -1)
  if (!chats.length) {
    return { error: 'No chats to clear' }
  }

  const pipeline = redis.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${targetUserId}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function saveChat(chat: Chat, userId: string = 'anonymous') {
  const session = await auth()

  if ((session && session.user) || userId === 'anonymous') {
    const pipeline = redis.pipeline()
    pipeline.hmset(`chat:${chat.id}`, chat)
    pipeline.zadd(`user:chat:${chat.userId}`, {
      score: Date.now(),
      member: `chat:${chat.id}`
    })
    await pipeline.exec()
  } else {
    return
  }
}

export async function getSharedChat(id: string) {
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string, userId: string = 'anonymous') {
  const session = await auth()

  if (!session?.user?.id || userId !== 'anonymous') {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id || chat.userId !== userId) {
    return {
      error: 'Something went wrong. Please try again.'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${id}`
  }

  await redis.hmset(`chat:${id}`, payload)

  return payload
}

export async function getMissingKeys() {
  const keysRequired = [
    'OPENAI_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ]
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}
