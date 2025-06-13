import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '应用运行正常',
    database: {
      configured: !!process.env.DATABASE_URL,
      mode: process.env.DATABASE_URL ? 'database' : 'localStorage'
    }
  })
} 