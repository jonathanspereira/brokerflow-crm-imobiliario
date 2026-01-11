"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarClock, MapPin, User, Plus, ChevronLeft, ChevronRight, X, Edit2, Trash2 } from "lucide-react"
import { eventsService, type Event } from "@/lib/services/events.service"
import { toast } from "sonner"

const typeColors: Record<string, string> = {
  Visita: "bg-blue-100 text-blue-700",
  "Reunião": "bg-purple-100 text-purple-700",
  "Follow-up": "bg-amber-100 text-amber-700",
}

const statusColors: Record<string, string> = {
  Confirmado: "bg-emerald-100 text-emerald-700",
  Pendente: "bg-slate-200 text-slate-700",
  Reagendado: "bg-orange-100 text-orange-700",
}

export default function AgendaPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: "",
    client: "",
    type: "Visita" as Event["type"],
    date: "",
    time: "",
    location: "",
    status: "Pendente" as Event["status"],
    notes: "",
  })

  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await eventsService.getAll()
      setEvents(data)
    } catch (error) {
      console.error("Failed to load events:", error)
      toast.error("Erro ao carregar eventos")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const term = query.toLowerCase()
    return events
      .filter((item) =>
        [item.title, item.client, item.location, item.notes]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(term))
      )
      .filter((item) => (typeFilter ? item.type === typeFilter : true))
      .filter((item) => (statusFilter ? item.status === statusFilter : true))
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
  }, [events, query, statusFilter, typeFilter])

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Event[]>>((acc, event) => {
      const dayKey = new Date(event.datetime).toISOString().split("T")[0]
      if (!acc[dayKey]) acc[dayKey] = []
      acc[dayKey].push(event)
      return acc
    }, {})
  }, [filtered])

  const eventsByDay = useMemo(() => grouped, [grouped])

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const start = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startWeekday = start.getDay()
    const todayKey = new Date().toISOString().split("T")[0]

    const pad = (value: number) => value.toString().padStart(2, "0")
    const cells: { key: string; day: number | null; dateKey?: string; isToday?: boolean; events?: Event[] }[] = []

    for (let i = 0; i < startWeekday; i++) {
      cells.push({ key: `prev-${i}`, day: null })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`
      cells.push({
        key: dateKey,
        day,
        dateKey,
        isToday: dateKey === todayKey,
        events: eventsByDay[dateKey] || [],
      })
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `next-${cells.length}`, day: null })
    }

    return cells
  }, [calendarDate, eventsByDay])

  const monthLabel = useMemo(
    () =>
      calendarDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    [calendarDate]
  )

  const stats = useMemo(() => {
    const now = new Date()
    const todayKey = now.toISOString().split("T")[0]
    const inSevenDays = new Date(now)
    inSevenDays.setDate(now.getDate() + 7)

    const totalWeek = events.filter((event) => new Date(event.datetime) <= inSevenDays).length
    const totalToday = events.filter((event) => event.datetime.startsWith(todayKey)).length
    const confirmed = events.filter((event) => event.status === "Confirmado").length

    return { totalWeek, totalToday, confirmed }
  }, [events])

  const resetForm = () => {
    setNewEvent({
      title: "",
      client: "",
      type: "Visita",
      date: "",
      time: "",
      location: "",
      status: "Pendente",
      notes: "",
    })
  }

  const handleAdd = async () => {
    if (!newEvent.title || !newEvent.client || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast.error("Preencha título, cliente, data, horário e local")
      return
    }

    const datetime = `${newEvent.date}T${newEvent.time}`

    try {
      if (editingEvent) {
        // Update existing event
        await eventsService.update(editingEvent.id, {
          title: newEvent.title,
          client: newEvent.client,
          type: newEvent.type,
          datetime,
          location: newEvent.location,
          status: newEvent.status,
          notes: newEvent.notes || undefined,
        })
      } else {
        // Create new event
        await eventsService.create({
          title: newEvent.title,
          client: newEvent.client,
          type: newEvent.type,
          datetime,
          location: newEvent.location,
          status: newEvent.status,
          notes: newEvent.notes || undefined,
        })
      }
      
      // Reload events
      await loadEvents()
      resetForm()
      setEditingEvent(null)
      setShowAddModal(false)
      toast.success(editingEvent ? "Evento atualizado com sucesso!" : "Evento criado com sucesso!")
    } catch (error) {
      console.error("Failed to save event:", error)
      toast.error("Erro ao salvar evento")
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja deletar este evento?")) return

    try {
      await eventsService.delete(eventId)
      await loadEvents()
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast.error("Erro ao deletar evento")
    }
  }

  const handleEdit = (event: Event) => {
    const [date, time] = event.datetime.split("T")
    setNewEvent({
      title: event.title,
      client: event.client,
      type: event.type,
      date,
      time: time.substring(0, 5),
      location: event.location,
      status: event.status,
      notes: event.notes || "",
    })
    setEditingEvent(event)
    setShowAddModal(true)
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    })
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  const goMonth = (delta: number) => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAddModal) {
        setShowAddModal(false)
      }
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [showAddModal])

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Agenda</h1>
            <p className="text-slate-500">Organize visitas, reuniões e follow-ups com seus clientes.</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por título, cliente ou local"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-72"
            />
            <Button onClick={() => { setEditingEvent(null); resetForm(); setShowAddModal(true) }} title="Adicionar evento">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Próximos 7 dias</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalWeek}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Hoje</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalToday}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Confirmados</p>
              <p className="text-3xl font-bold text-slate-900">{stats.confirmed}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Calendário</CardTitle>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Button variant="outline" size="icon" onClick={() => goMonth(-1)} title="Mês anterior">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="w-32 text-center font-semibold capitalize">{monthLabel}</span>
                  <Button variant="outline" size="icon" onClick={() => goMonth(1)} title="Próximo mês">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 uppercase">
                  <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {calendarDays.map((cell) => (
                    <div
                      key={cell.key}
                      className={
                        cell.day
                          ? "rounded-lg border border-slate-200 bg-white p-3 h-28 flex flex-col gap-1"
                          : "rounded-lg border border-dashed border-slate-200 bg-slate-50 h-28"
                      }
                    >
                      {cell.day && (
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span className={cell.isToday ? "bg-slate-900 text-white rounded-full px-2" : ""}>{cell.day}</span>
                          {cell.events && cell.events.length > 0 && (
                            <Badge variant="secondary" className="text-[11px]">
                              {cell.events.length}
                            </Badge>
                          )}
                        </div>
                      )}
                      {cell.day && cell.events && cell.events.length > 0 && (
                        <div className="mt-1 flex flex-col gap-1">
                          {cell.events.slice(0, 2).map((event) => (
                            <div key={event.id} className="flex items-center gap-1 text-[11px] text-slate-700">
                              <span className="h-2 w-2 rounded-full bg-slate-500" />
                              <span className="truncate">{event.title}</span>
                            </div>
                          ))}
                          {cell.events.length > 2 && (
                            <span className="text-[11px] text-slate-500">+{cell.events.length - 2} eventos</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Agenda</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Todos os tipos</option>
                      <option value="Visita">Visita</option>
                      <option value="Reunião">Reunião</option>
                      <option value="Follow-up">Follow-up</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Todos os status</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Confirmado">Confirmado</option>
                      <option value="Reagendado">Reagendado</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[70vh]">
                  <div className="divide-y divide-slate-100">
                    {Object.keys(grouped).length === 0 && (
                      <div className="p-6 text-sm text-slate-500">Nenhum evento encontrado.</div>
                    )}
                    {Object.entries(grouped).map(([day, dayEvents]) => (
                      <div key={day} className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <CalendarClock className="h-4 w-4" />
                          <span>{formatDate(day)}</span>
                        </div>
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-slate-900 text-white">{formatTime(event.datetime)}</Badge>
                                <div>
                                  <p className="font-semibold text-slate-900">{event.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <User className="h-3 w-3" />
                                    <span>{event.client}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={typeColors[event.type] || "bg-slate-100 text-slate-700"}>{event.type}</Badge>
                                <Badge className={statusColors[event.status] || "bg-slate-100 text-slate-700"}>{event.status}</Badge>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(event)} title="Editar">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)} title="Deletar" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                            {event.notes && <p className="text-sm text-slate-600">{event.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Event Modal */}
        {showAddModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <Card 
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{editingEvent ? "Editar evento" : "Adicionar evento"}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setShowAddModal(false); setEditingEvent(null) }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Título"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <Input
                  placeholder="Cliente"
                  value={newEvent.client}
                  onChange={(e) => setNewEvent({ ...newEvent, client: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as Event["type"] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Visita">Visita</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as Event["status"] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Reagendado">Reagendado</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Local"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
                <Input
                  placeholder="Notas (opcional)"
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setShowAddModal(false); setEditingEvent(null) }}
                  >
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" /> {editingEvent ? "Salvar alterações" : "Salvar evento"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
