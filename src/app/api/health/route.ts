import { NextResponse } from 'next/server'
import { initializeEnvironment, isDatabaseAvailable } from '@/lib/services/vercelCompat'
import { prisma } from '@/lib/services/databaseService'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // 初始化环境变量
    initializeEnvironment()
    
    // 检查数据库配置状态
    const dbConfigured = isDatabaseAvailable()
    
    let databaseStatus = {
      configured: dbConfigured,
      connected: false,
      error: null as string | null
    }
    
    // 如果配置了数据库，测试连接
    if (dbConfigured) {
      try {
        await prisma.$queryRaw`SELECT 1`
        databaseStatus.connected = true
      } catch (error) {
        databaseStatus.connected = false
        databaseStatus.error = error instanceof Error ? error.message : '数据库连接失败'
      }
    } else {
      databaseStatus.error = '数据库未配置'
    }
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: databaseStatus,
      storage: {
        mode: dbConfigured ? 'database' : 'localStorage',
        available: true
      }
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : '健康检查失败',
      database: {
        configured: false,
        connected: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }, { status: 500 })
  }
} 