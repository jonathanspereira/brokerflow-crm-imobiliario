import api from '../axios'

export interface Property {
  id: number | string  // Pode ser number (in-memory) ou string (Prisma cuid)
  project: string
  address: string
  unit: string
  price: number
  status: 'Pre-lancamento' | 'Disponivel' | 'Vendido'
  books?: string[]
}

export const inventoryService = {
  // Get all properties
  async getAll(status?: string): Promise<Property[]> {
    try {
      const params = new URLSearchParams()
      if (status && status !== 'all') {
        params.append('status', status)
      }
      const response = await api.get(`/inventory?${params.toString()}`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      return []
    }
  },

  // Get available properties only
  async getAvailable(): Promise<Property[]> {
    try {
      const response = await api.get('/inventory/available')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch available properties:', error)
      return []
    }
  },

  // Get property by ID
  async getById(id: number | string): Promise<Property | null> {
    try {
      const response = await api.get(`/inventory/${id}`)
      return response.data.data || null
    } catch (error) {
      console.error('Failed to fetch property:', error)
      return null
    }
  },

  // Get properties by project
  async getByProject(project: string): Promise<Property[]> {
    try {
      const response = await api.get(`/inventory/project/${encodeURIComponent(project)}`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch properties by project:', error)
      return []
    }
  },

  // Create new property
  async create(data: Omit<Property, 'id'>): Promise<Property> {
    try {
      const response = await api.post('/inventory', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create property:', error)
      throw error
    }
  },

  // Update property
  async update(id: number | string, data: Partial<Property>): Promise<Property> {
    try {
      const response = await api.patch(`/inventory/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update property:', error)
      throw error
    }
  },

  // Delete property
  async delete(id: number | string): Promise<void> {
    try {
      await api.delete(`/inventory/${id}`)
    } catch (error) {
      console.error('Failed to delete property:', error)
      throw error
    }
  },

  // Get property formatted name
  async getFormattedName(id: number | string): Promise<{ name: string; price: number } | null> {
    try {
      const response = await api.get(`/inventory/${id}/format`)
      return response.data.data || null
    } catch (error) {
      console.error('Failed to format property name:', error)
      return null
    }
  },

  // Format property display name
  formatPropertyDisplay(property: Property): string {
    return `${property.project} - ${property.unit}`
  }
}
