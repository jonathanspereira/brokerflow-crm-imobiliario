"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { whatsappService, type WhatsAppChat as WhatsAppChatType, type WhatsAppMessage as WhatsAppMessageType } from "@/lib/services/whatsapp.service"
import { 
  Search, 
  Send, 
  Paperclip, 
  CheckCheck, 
  Building,
  FileText,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2
} from "lucide-react"

// Books from each project
const projectBooks = [
  {
    id: 1,
    project: "Bosque Dois Irmãos",
    title: "Bosque Dois Irmãos - Book Digital",
    description: "Apresentação completa do empreendimento",
    file: "Bosque Dois Irmãos.pdf"
  },
  {
    id: 2,
    project: "Alto do Joa",
    title: "Alto do Joa - Book Digital",
    description: "Apresentação completa do empreendimento",
    file: "Alto do Joa.pdf.pdf"
  },
  {
    id: 3,
    project: "Jardins do Bosque",
    title: "Jardins do Bosque - Book Digital",
    description: "Apresentação completa do empreendimento",
    file: "Jardins do Bosque.pdf.pdf"
  }
]

// Type aliases para tipos do serviço
type WhatsAppChat = WhatsAppChatType
type WhatsAppMessage = WhatsAppMessageType

export default function ChatPage() {
  // WhatsApp Connection State
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "qr_ready" | "connected">("disconnected")
  const [qrCode, setQrCode] = useState<string>("")
  const [whatsappChats, setWhatsappChats] = useState<WhatsAppChat[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  
  // Chat State
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize WhatsApp Connection
  const initializeWhatsApp = async () => {
    setConnectionStatus("connecting")
    setQrCode("") // Clear previous QR code
    
    try {
      console.log("Iniciando WhatsApp...")
      const data = await whatsappService.initialize()
      console.log("Resposta de inicialização:", data)
      
      if (data.qrCode) {
        console.log("QR Code recebido!")
        setQrCode(data.qrCode)
        setConnectionStatus("qr_ready")
        // Poll for connection status
        pollConnectionStatus()
      } else if (data.status === "connected") {
        console.log("Já conectado!")
        setConnectionStatus("connected")
        loadChats()
      } else if (data.status === "initializing") {
        console.log("Inicialização em andamento, aguardando...")
        // Aguarda um pouco e tenta novamente
        setTimeout(() => initializeWhatsApp(), 3000)
      } else {
        console.log("Status desconhecido:", data)
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      console.error("Error initializing WhatsApp:", error)
      setConnectionStatus("disconnected")
    }
  }

  // Poll for connection status
  const pollConnectionStatus = async () => {
    let pollCount = 0
    const interval = setInterval(async () => {
      pollCount++
      try {
        const data = await whatsappService.getStatus()
        console.log(`Poll ${pollCount} - Status:`, data.status)
        
        if (data.status === "active") {
          setConnectionStatus("connected")
          clearInterval(interval)
          loadChats()
        } else if (data.status === "inactive") {
          setConnectionStatus("disconnected")
          clearInterval(interval)
        }
      } catch (error) {
        console.error("Error checking status:", error)
      }
    }, 2000)
    
    // Clear interval after 2 minutes
    setTimeout(() => clearInterval(interval), 120000)
  }

  // Load WhatsApp Chats
  const loadChats = async () => {
    setIsLoadingChats(true)
    
    try {
      const chats = await whatsappService.getChats()
      // Ensure chats is always an array
      setWhatsappChats(Array.isArray(chats) ? chats : [])
    } catch (error) {
      console.error("Error loading chats:", error)
      setWhatsappChats([])
    } finally {
      setIsLoadingChats(false)
    }
  }

  // Load Messages for a Chat
  const loadMessages = async (chatId: string) => {
    try {
      const msgs = await whatsappService.getMessages(chatId)
      setMessages(msgs)
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  // Send Message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return

    setIsSending(true)
    setErrorMessage("")
    
    try {
      const msg = await whatsappService.sendMessage(selectedChat.id, newMessage)
      
      // Add message to local state
      const message: WhatsAppMessage = msg as WhatsAppMessage
      
      setMessages(prev => [...prev, message])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      setErrorMessage("Erro ao enviar mensagem. Tente novamente.")
      setTimeout(() => setErrorMessage(""), 5000)
    } finally {
      setIsSending(false)
    }
  }

  // Disconnect WhatsApp
  const disconnectWhatsApp = async () => {
    try {
      await whatsappService.disconnect()
      
      setConnectionStatus("disconnected")
      setWhatsappChats([])
      setSelectedChat(null)
      setMessages([])
      setQrCode("")
    } catch (error) {
      console.error("Error disconnecting:", error)
    }
  }

  // Handle Chat Selection
  const handleSelectChat = (chat: WhatsAppChat) => {
    setSelectedChat(chat)
    loadMessages(chat.id)
  }

  // Auto-refresh messages when chat is selected
  useEffect(() => {
    if (!selectedChat || connectionStatus !== "connected") return

    const interval = setInterval(() => {
      loadMessages(selectedChat.id)
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [selectedChat, connectionStatus])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filter chats by search query
  const filteredChats = Array.isArray(whatsappChats) 
    ? whatsappChats.filter((chat) =>
        chat.chatName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Send Book via WhatsApp
  const handleSendBook = async (book: typeof projectBooks[0]) => {
    if (!selectedChat || isSending) return
    
    const bookMessage = `📚 *${book.title}*\n\n${book.description}\n\nEmpreendimento: ${book.project}`
    
    setIsSending(true)
    setErrorMessage("")
    
    try {
      await whatsappService.sendMessage(selectedChat.id, bookMessage)
      
      // Reload messages after sending
      await loadMessages(selectedChat.id)
    } catch (error) {
      console.error("Error sending book:", error)
      setErrorMessage("Erro ao enviar book. Tente novamente.")
      setTimeout(() => setErrorMessage(""), 5000)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-screen flex" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Column 1: Chats List / Connection Panel */}
      <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col">
        {/* Connection Status Header */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectionStatus === "connected" ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-sm font-semibold">
                {connectionStatus === "connected" ? "Conectado" : "WhatsApp"}
              </span>
            </div>
            {connectionStatus === "connected" && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={disconnectWhatsApp}
                className="h-7 text-xs"
              >
                Desconectar
              </Button>
            )}
          </div>
          
          {/* Connection Actions */}
          {connectionStatus === "disconnected" && (
            <Button 
              onClick={initializeWhatsApp} 
              className="w-full"
              size="sm"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Conectar WhatsApp
            </Button>
          )}
          
          {connectionStatus === "connecting" && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription className="text-xs">
                Iniciando conexão...
              </AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === "connected" && (
            <Button 
              onClick={loadChats} 
              className="w-full"
              size="sm"
              variant="outline"
              disabled={isLoadingChats}
            >
              {isLoadingChats ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Conversas
                </>
              )}
            </Button>
          )}
        </div>

        {/* QR Code Display */}
        {connectionStatus === "qr_ready" && qrCode && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="text-center space-y-2">
              <QrCode className="h-12 w-12 mx-auto text-primary" />
              <h3 className="font-semibold text-slate-900">Escaneie o QR Code</h3>
              <p className="text-xs text-slate-600">
                Abra o WhatsApp no seu celular e escaneie este código
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-slate-500 text-center">
              O código expira em alguns minutos
            </p>
          </div>
        )}

        {/* Search Bar (only when connected) */}
        {connectionStatus === "connected" && (
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar conversas..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Chats List */}
        {connectionStatus === "connected" && (
          <ScrollArea className="flex-1">
            {isLoadingChats ? (
              <div className="p-6 text-center text-sm text-slate-500 space-y-2">
                <Loader2 className="h-6 w-6 mx-auto animate-spin" />
                <p>Carregando conversas...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa disponível"}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left ${
                      selectedChat?.id === chat.id ? "bg-slate-100" : ""
                    }`}
                  >
                    <Avatar>
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>{chat.chatName?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {chat.chatName}
                        </p>
                        <span className="text-xs text-slate-500">{chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{chat.lastMessage || "Sem mensagens"}</p>
                    </div>
                    {chat.unread > 0 && (
                      <Badge variant="default" className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {chat.unread}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Column 2: Chat Area */}
      <div className="flex-1 bg-slate-50 flex flex-col">
        {connectionStatus !== "connected" ? (
          /* Connection Status Message */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-6">
              {connectionStatus === "disconnected" && (
                <>
                  <WifiOff className="h-16 w-16 mx-auto text-slate-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      WhatsApp não conectado
                    </h3>
                    <p className="text-sm text-slate-600">
                      Conecte sua conta do WhatsApp para começar a enviar e receber mensagens diretamente pelo CRM.
                    </p>
                  </div>
                </>
              )}
              {connectionStatus === "connecting" && (
                <>
                  <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Conectando...
                    </h3>
                    <p className="text-sm text-slate-600">
                      Aguarde enquanto estabelecemos a conexão com o WhatsApp Web.
                    </p>
                  </div>
                </>
              )}
              {connectionStatus === "qr_ready" && (
                <>
                  <QrCode className="h-16 w-16 mx-auto text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Escaneie o QR Code
                    </h3>
                    <p className="text-sm text-slate-600">
                      Use o seu celular para escanear o código QR disponível no painel lateral.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : !selectedChat ? (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-6">
              <FileText className="h-16 w-16 mx-auto text-slate-300" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-sm text-slate-600">
                  Escolha uma conversa na lista ao lado para visualizar e enviar mensagens.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat */
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedChat.avatar} />
                  <AvatarFallback>{selectedChat.chatName?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">{selectedChat.chatName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>WhatsApp Web</span>
                    <span className="text-slate-400">{selectedChat.phone}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => loadMessages(selectedChat.id)}
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <Alert className="mx-6 mt-4 bg-red-50 border-red-200">
                <AlertDescription className="text-red-800 text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-8">
                    Nenhuma mensagem nesta conversa
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.fromMe
                            ? "bg-green-500 text-white"
                            : "bg-white text-slate-900 border border-slate-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-xs ${message.fromMe ? "text-green-100" : "text-slate-500"}`}>
                            {new Date(message.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {message.fromMe && (
                            <CheckCheck className="h-3 w-3 text-green-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input Footer */}
            <div className="bg-white border-t border-slate-200 p-4">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="flex-1"
                  disabled={isSending}
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Column 3: Books Only */}
      <div className="w-[350px] bg-white border-l border-slate-200 flex flex-col">
        <div className="border-b border-slate-200 px-4 py-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-slate-900">Books dos Empreendimentos</span>
        </div>

        <ScrollArea className="flex-1 p-4">
          {!selectedChat || connectionStatus !== "connected" ? (
            <div className="text-center text-sm text-slate-500 py-8">
              Selecione uma conversa para enviar books
            </div>
          ) : (
            <div className="space-y-4">
              {projectBooks.map((book) => (
                <Card key={book.id} className="overflow-hidden">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-semibold">
                      {book.title}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">{book.description}</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{book.project}</span>
                    </div>
                    <Button
                      onClick={() => handleSendBook(book)}
                      className="w-full"
                      size="sm"
                      disabled={isSending}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Enviar Book
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
