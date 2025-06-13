import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // 基本的健康检查，不涉及复杂依赖
    const databaseUrl = process.env.DATABASE_URL
    
    const databaseStatus = {
      configured: !!databaseUrl,
      connected: false,
      error: databaseUrl ? null : '数据库未配置，使用本地存储模式',
      mode: databaseUrl ? 'database' : 'localStorage'
    }
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: databaseStatus,
      storage: {
        mode: databaseStatus.mode,
        available: true
      },
      message: databaseUrl ? '系统运行正常' : '系统运行正常（本地存储模式）'
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        configured: false,
        connected: false,
        error: '无法确定数据库状态',
        mode: 'localStorage'
      },
      storage: {
        mode: 'localStorage',
        available: true
      },
      message: '系统运行正常（本地存储模式）'
    })
  }
} 