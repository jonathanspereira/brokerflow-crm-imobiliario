import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'not-configured',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'N/A',
    }

    return NextResponse.json(healthData, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
