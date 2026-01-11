import api from '../axios'

export interface Team {
  id: number
  name: string
  agenciaId: number
  gestorId?: number
  gestor?: {
    id: number
    name: string
    email: string
  }
  createdAt: string
  updatedAt?: string
}

export interface CreateTeamInput {
  name: string
  description?: string
}

export interface UpdateTeamInput {
  name?: string
}

export interface TeamMember {
  userId: number
  role: 'GESTOR' | 'CORRETOR'
}

export interface Manager {
  id: number
  name: string
  email: string
  role: string
}

export const teamsService = {
  // Get all teams for current user's agency
  async list(): Promise<Team[]> {
    try {
      const response = await api.get('/teams')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch teams:', error)
      throw error
    }
  },

  // Get available managers
  async listManagers(): Promise<Manager[]> {
    try {
      const response = await api.get('/teams/managers')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch managers:', error)
      throw error
    }
  },

  // Create new team
  async create(data: CreateTeamInput): Promise<Team> {
    try {
      const response = await api.post('/teams', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create team:', error)
      throw error
    }
  },

  // Add member to team
  async addMember(teamId: number, userId: number, role: 'GESTOR' | 'CORRETOR'): Promise<Team> {
    try {
      const response = await api.post(`/teams/${teamId}/members`, {
        userId,
        role,
      })
      return response.data.data
    } catch (error) {
      console.error('Failed to add team member:', error)
      throw error
    }
  },

  // Set team manager/gestor
  async setManager(teamId: number, managerId: number): Promise<Team> {
    try {
      const response = await api.post(`/teams/${teamId}/manager`, {
        managerId,
      })
      return response.data.data
    } catch (error) {
      console.error('Failed to set team manager:', error)
      throw error
    }
  },
}
