type JSONValue = any

class InMemoryCache {
  private store = new Map<string, { value: JSONValue; expiresAt: number }>()

  get(key: string): JSONValue | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  set(key: string, value: JSONValue, ttlSeconds: number) {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.store.set(key, { value, expiresAt })
  }

  delPrefix(prefix: string) {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k)
    }
  }
}

const REDIS_URL = process.env.REDIS_URL
let redisClient: any = null
const memory = new InMemoryCache()

async function ensureRedis() {
  if (!REDIS_URL || redisClient) return redisClient
  try {
    const mod = await import('redis')
    redisClient = mod.createClient({ url: REDIS_URL })
    redisClient.on('error', (err: any) => {
      console.error('[Cache] Redis error', err?.message || err)
    })
    await redisClient.connect()
    console.log('[Cache] Connected to Redis')
  } catch (e) {
    console.warn('[Cache] Redis not available, using in-memory cache')
    redisClient = null
  }
  return redisClient
}

export const cache = {
  async getJSON<T = any>(key: string): Promise<T | null> {
    const client = await ensureRedis()
    if (client) {
      const raw = await client.get(key)
      if (!raw) return null
      try { return JSON.parse(raw) as T } catch { return null }
    }
    return memory.get(key)
  },
  async setJSON(key: string, value: JSONValue, ttlSeconds = 60): Promise<void> {
    const client = await ensureRedis()
    if (client) {
      await client.setEx(key, ttlSeconds, JSON.stringify(value))
      return
    }
    memory.set(key, value, ttlSeconds)
  },
  async delPrefix(prefix: string): Promise<void> {
    const client = await ensureRedis()
    if (client) {
      const keys = await client.keys(`${prefix}*`)
      if (keys.length) await client.del(keys)
      return
    }
    memory.delPrefix(prefix)
  }
}
