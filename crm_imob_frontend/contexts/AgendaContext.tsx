"use client"

import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from "react"
import { eventsService, Event as EventType, CreateEventInput } from "@/lib/services/events.service"

type Event = EventType

type AgendaContextType = {
  events: Event[]
  addEvent: (event: CreateEventInput) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  updateEvent: (id: string, data: Partial<CreateEventInput>) => Promise<void>
  loadEvents: () => Promise<void>
  isLoading: boolean
  todayEventsCount: number
  todayEvents: Event[]
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined)

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const data = await eventsService.getAll()
      setEvents(data)
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const addEvent = async (eventData: CreateEventInput) => {
    try {
      const newEvent = await eventsService.create(eventData)
      setEvents((prev) => [...prev, newEvent])
    } catch (error) {
      console.error("Failed to create event:", error)
      throw error
    }
  }

  const updateEvent = async (id: string, data: Partial<CreateEventInput>) => {
    try {
      const updatedEvent = await eventsService.update(id, data)
      setEvents((prev) => prev.map((event) => (event.id === id ? updatedEvent : event)))
    } catch (error) {
      console.error("Failed to update event:", error)
      throw error
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      await eventsService.delete(id)
      setEvents((prev) => prev.filter((event) => event.id !== id))
    } catch (error) {
      console.error("Failed to delete event:", error)
      throw error
    }
  }

  const todayKey = useMemo(() => new Date().toISOString().split("T")[0], [])

  const todayEvents = useMemo(() => {
    return events.filter((event) => event.datetime.startsWith(todayKey))
  }, [events, todayKey])

  const todayEventsCount = todayEvents.length

  return (
    <AgendaContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        loadEvents,
        isLoading,
        todayEventsCount,
        todayEvents,
      }}
    >
      {children}
    </AgendaContext.Provider>
  )
}

export function useAgenda() {
  const context = useContext(AgendaContext)
  if (!context) {
    throw new Error("useAgenda must be used within AgendaProvider")
  }
  return context
}
