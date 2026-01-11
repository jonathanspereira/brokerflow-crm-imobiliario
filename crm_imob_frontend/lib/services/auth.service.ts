import api from '../axios'

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AUTONOMO' | 'GESTOR' | 'CORRETOR'
  agenciaId: number
  createdAt: string
  updatedAt?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  userType: "AUTONOMO" | "CORRETOR" | "ADMIN"
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  user: User
}

export interface ForgotPasswordPayload {
  email: string
}

export interface UpdateProfilePayload {
  name?: string
  phone?: string
  password?: string
}

export const authService = {
  // Login
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })
      return response.data.data || response.data
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  },

  // Sign up
  async signup(name: string, email: string, password: string, userType: "AUTONOMO" | "CORRETOR" | "ADMIN"): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/signup', {
        name,
        email,
        password,
        userType,
      })
      return response.data.data || response.data
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me')
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      throw error
    }
  },

  // Update profile
  async updateProfile(data: UpdateProfilePayload): Promise<User> {
    try {
      const response = await api.patch('/auth/profile', data)
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout failed:', error)
      // Continue logout even if API call fails
    }
  },

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data.data || response.data
    } catch (error) {
      console.error('Forgot password failed:', error)
      throw error
    }
  },

  // Get token from localStorage
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  },

  // Save token to localStorage
  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  },

  // Remove token from localStorage
  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getToken() !== null
  },
}
