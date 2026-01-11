import api from '../axios'

export interface WhatsAppChat {
  id: string
  sessionId?: string
  chatName: string
  phone?: string
  avatar?: string
  lastMessage?: string
  time?: string
  unread: number
  isGroup?: boolean
  isBroadcast?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface WhatsAppMessage {
  id: string
  sessionId?: string
  chatId: string
  content: string
  timestamp: string
  fromMe: boolean
  type?: 'text' | 'image' | 'document' | 'video' | 'audio'
  status?: 'sent' | 'delivered' | 'read' | 'error'
  hasMedia?: boolean
  mediaUrl?: string
  mediaFileName?: string
  createdAt?: string
}

export interface ConnectionStatus {
  status: 'active' | 'inactive' | 'expired'
  phoneNumber?: string
  qrCode?: string
  expiresAt?: string
}

class WhatsAppService {
  private basePath = '/whatsapp'
  private initializePromise: Promise<{ qrCode?: string; status?: string; expiresAt?: number }> | null = null

  async initialize(): Promise<{ qrCode?: string; status?: string; expiresAt?: number }> {
    try {
      // Se uma inicialização já está em andamento, aguarda
      if (this.initializePromise) {
        return this.initializePromise
      }

      this.initializePromise = (async () => {
        const response = await api.post(`${this.basePath}/initialize`)
        const data = response.data.data || response.data
        
        // Se retornar "initializing", aguarda um pouco e tenta novamente
        if (data.status === "initializing") {
          await new Promise(resolve => setTimeout(resolve, 2000))
          return this.initialize()
        }

        return data
      })()

      const result = await this.initializePromise
      this.initializePromise = null
      return result
    } catch (error) {
      this.initializePromise = null
      throw error
    }
  }

  async waitForAuthentication(): Promise<{ status: string }> {
    try {
      const response = await api.post(`${this.basePath}/authenticate`)
      return response.data.data || response.data
    } catch (error) {
      throw error
    }
  }

  async getStatus(): Promise<ConnectionStatus> {
    try {
      const response = await api.get(`${this.basePath}/status`)
      return response.data.data || response.data
    } catch (error) {
      throw error
    }
  }

  async getChats(): Promise<WhatsAppChat[]> {
    try {
      const response = await api.get(`${this.basePath}/chats`)
      const data = response.data.data || response.data.chats || response.data
      
      // Ensure we always return an array
      if (Array.isArray(data)) {
        return data
      }
      
      console.warn('getChats: Response is not an array', data)
      return []
    } catch (error) {
      console.error('Failed to fetch chats:', error)
      return []
    }
  }

  async getMessages(chatId: string): Promise<WhatsAppMessage[]> {
    try {
      const response = await api.get(`${this.basePath}/messages/${chatId}`)
      const data = response.data.data || response.data.messages || response.data
      
      // Ensure we always return an array
      if (Array.isArray(data)) {
        return data
      }
      
      console.warn('getMessages: Response is not an array', data)
      return []
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      return []
    }
  }

  async sendMessage(chatId: string, content: string): Promise<WhatsAppMessage> {
    try {
      const response = await api.post(`${this.basePath}/send`, {
        chatId,
        content
      })
      return response.data.data || response.data
    } catch (error) {
      throw error
    }
  }

  async disconnect(): Promise<{ message: string }> {
    try {
      const response = await api.post(`${this.basePath}/disconnect`)
      return response.data.data || response.data
    } catch (error) {
      throw error
    }
  }

  async listSessions(): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await api.get(`${this.basePath}/sessions`)
      return response.data.data || response.data.sessions || []
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      return []
    }
  }
}

export const whatsappService = new WhatsAppService()
