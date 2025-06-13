import { NextResponse } from 'next/server'
import { initializeEnvironment, isDatabaseAvailable } from '@/lib/services/vercelCompat'
import { prisma } from '@/lib/services/databaseService'
import { useDatabaseStore } from '@/store/useDatabaseStore'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // 初始化环境变量
    initializeEnvironment()
    
    // 获取数据库配置详情
    const dbStore = useDatabaseStore.getState()
    const dbConfigured = isDatabaseAvailable()
    
    // 调试信息：检查DATABASE_URL格式
    const databaseUrl = process.env.DATABASE_URL || dbStore.databaseUrl
    let urlAnalysis = null
    
    if (databaseUrl) {
      try {
        const url = new URL(databaseUrl)
        urlAnalysis = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          isValidFormat: true,
          error: null
        }
      } catch (error) {
        urlAnalysis = {
          protocol: null,
          hostname: null,
          port: null,
          pathname: null,
          isValidFormat: false,
          error: error instanceof Error ? error.message : '无效的URL格式'
        }
      }
    }
    
    let databaseStatus = {
      configured: dbConfigured,
      connected: false,
      error: null as string | null,
      configDetails: {
        hasUrl: !!databaseUrl,
        urlLength: databaseUrl?.length || 0,
        urlPreview: databaseUrl ? `${databaseUrl.substring(0, 20)}...` : null,
        urlAnalysis
      }
    }
    
    // 如果配置了数据库，测试连接
    if (dbConfigured && databaseUrl) {
      try {
        await prisma.$queryRaw`SELECT 1`
        databaseStatus.connected = true
      } catch (error) {
        databaseStatus.connected = false
        databaseStatus.error = error instanceof Error ? error.message : '数据库连接失败'
      }
    } else {
      databaseStatus.error = '数据库未配置或URL无效'
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
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
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