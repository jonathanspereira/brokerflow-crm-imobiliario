import axios from 'axios'
import { API_BASE_URL } from './api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Add token to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle error responses
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    interface RetryConfig {
      __retryCount?: number
      method?: string
      [key: string]: unknown
    }
    const errorData = error as { config?: RetryConfig; code?: string; response?: { status?: number } }
    const config: RetryConfig = errorData?.config || {}
    // Retry GET requests on timeout up to 2 times with backoff
    if (errorData?.code === 'ECONNABORTED' && (config.method === 'get')) {
      config.__retryCount = (config.__retryCount || 0) + 1
      if (config.__retryCount <= 2) {
        const delayMs = 1000 * config.__retryCount
        await new Promise((res) => setTimeout(res, delayMs))
        return api.request(config)
      }
    }
    if (typeof window !== 'undefined') {
      const axiosError = error as import('axios').AxiosError
      if (axiosError.response?.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('authToken')
        window.location.href = '/auth/login'
      } else if (axiosError.response?.status === 402) {
        // Payment Required - redirect to billing
        window.location.href = '/crm/billing?reason=payment_required'
      } else if (axiosError.response?.status === 403) {
        // Forbidden - show permission error
        type ResponseData = { code?: string }
        const code = (axiosError.response?.data as ResponseData)?.code
        if (code === 'SUBSCRIPTION_CANCELED') {
          window.location.href = '/crm/billing?reason=subscription_canceled'
        }
        // Other 403 errors are handled by the component
      }
    }
    return Promise.reject(error)
  }
)

export default api
