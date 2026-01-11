import api from '../axios'

export interface Event {
  id: string
  userId: string
  title: string
  client: string
  type: 'Visita' | 'Reunião' | 'Follow-up'
  datetime: string
  location: string
  status: 'Confirmado' | 'Pendente' | 'Reagendado'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateEventInput {
  title: string
  client: string
  type: 'Visita' | 'Reunião' | 'Follow-up'
  datetime: string
  location: string
  status?: 'Confirmado' | 'Pendente' | 'Reagendado'
  notes?: string
}

export interface UpdateEventInput {
  title?: string
  client?: string
  type?: 'Visita' | 'Reunião' | 'Follow-up'
  datetime?: string
  location?: string
  status?: 'Confirmado' | 'Pendente' | 'Reagendado'
  notes?: string
}

class EventsService {
  private basePath = '/events'

  async getAll(): Promise<Event[]> {
    const response = await api.get<Event[]>(this.basePath)
    return response.data
  }

  async getById(id: string): Promise<Event> {
    const response = await api.get<Event>(`${this.basePath}/${id}`)
    return response.data
  }

  async create(data: CreateEventInput): Promise<Event> {
    const response = await api.post<Event>(this.basePath, data)
    return response.data
  }

  async update(id: string, data: UpdateEventInput): Promise<Event> {
    const response = await api.patch<Event>(`${this.basePath}/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`)
  }
}

export const eventsService = new EventsService()
