import { NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body || {}

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, error: 'Name, email, and phone are required' }, { status: 400 })
    }

    // Map to CRM lead payload
    const payload = {
      name,
      email,
      phone,
      source: 'Landing',
      propertyInterest: message || '',
      isSingleProponent: true,
    }

    const res = await axios.post(`${API_BASE_URL}/leads`, payload, { timeout: 10000 })
    const data = res.data?.data || res.data

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status || 500
    const errorMsg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit contact'
    return NextResponse.json({ success: false, error: errorMsg }, { status })
  }
}
