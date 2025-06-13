import { NextResponse } from 'next/server'
import { useDatabaseStore } from '@/store/useDatabaseStore'

export async function POST() {
  try {
    // 清理现有配置
    useDatabaseStore.getState().clearConfig()
    
    // 清理环境变量
    if (typeof process !== 'undefined' && process.env) {
      delete process.env.DATABASE_URL
      delete process.env.DIRECT_URL
    }
    
    return NextResponse.json({
      success: true,
      message: '数据库配置已清理',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '清理配置失败'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const store = useDatabaseStore.getState()
    
    return NextResponse.json({
      currentConfig: {
        isConfigured: store.isConfigured,
        hasUrl: !!store.databaseUrl,
        urlLength: store.databaseUrl?.length || 0,
        urlPreview: store.databaseUrl ? `${store.databaseUrl.substring(0, 30)}...` : null
      },
      environmentVars: {
        DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : null,
        DIRECT_URL: process.env.DIRECT_URL ? `${process.env.DIRECT_URL.substring(0, 30)}...` : null
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '获取配置失败'
    }, { status: 500 })
  }
} 