export interface WhatsAppChat {
  id: string
  name: string
  phone?: string
  avatar?: string
  lastMessage: string
  time: string
  unread: number
  isGroup: boolean
  isBroadcast?: boolean
  createdAt?: Date
}

export interface WhatsAppMessage {
  id: string
  chatId: string
  content: string
  timestamp: string
  fromMe: boolean
  type: "text" | "image" | "document" | "video" | "audio"
  status: "sent" | "delivered" | "read" | "error"
  hasMedia?: boolean
  mediaUrl?: string
  mediaFileName?: string
  quotedMessage?: {
    id: string
    content: string
    author?: string
  }
}

export interface WhatsAppConnection {
  status: "disconnected" | "connecting" | "qr_ready" | "connected" | "loading_history"
  qrCode?: string
  sessionId?: string
  phoneNumber?: string
  connectedAt?: Date
}

export interface QRCodeData {
  qrCode: string
  expiresAt: number
}

export interface WhatsAppSession {
  id: string
  status: "active" | "inactive" | "expired"
  qrCode?: string
  phoneNumber?: string
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}
