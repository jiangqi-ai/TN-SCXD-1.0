import { NextResponse } from 'next/server'
import { databaseHealthService, databaseProductService, databaseOrderService } from '@/lib/services/databaseService'
import { isDatabaseAvailable } from '@/lib/services/vercelCompat'

export async function GET() {
  try {
    // 首先检查数据库是否已配置
    const dbConfigured = isDatabaseAvailable()
    
    if (!dbConfigured) {
      return NextResponse.json({
        status: 'not_configured',
        message: '数据库未配置，系统使用本地存储模式',
        database: {
          configured: false,
          connection: { status: 'not_configured', message: '数据库未配置' },
          mode: 'localStorage'
        },
        timestamp: new Date().toISOString()
      })
    }

    // 检查数据库连接
    const connectionStatus = await databaseHealthService.checkConnection()
    
    if (connectionStatus.status === 'error') {
      return NextResponse.json({
        status: 'error',
        message: '数据库连接失败',
        error: connectionStatus.error,
        database: {
          configured: true,
          connection: connectionStatus,
          mode: 'database_error'
        },
        timestamp: new Date().toISOString()
      }, { status: 200 }) // 改为200状态码，避免前端报错
    }

    // 获取数据库统计
    const stats = await databaseHealthService.getStats()
    
    // 检查关键表的数据
    const [
      featuredProducts,
      recentOrders
    ] = await Promise.all([
      databaseProductService.getFeaturedProducts(3),
      databaseOrderService.getAllOrders({ page: 1, limit: 3 })
    ])

    return NextResponse.json({
      status: 'healthy',
      message: '攀岩设备下单系统运行正常',
      database: {
        configured: true,
        connection: connectionStatus,
        stats,
        mode: 'database',
        sampleData: {
          featuredProducts: featuredProducts.length,
          recentOrders: recentOrders.orders.length
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('数据库健康检查失败:', error)
    
    // 如果错误信息包含URL格式问题，说明是配置问题
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const isConfigError = errorMessage.includes('invalid port number') || 
                         errorMessage.includes('connection string') ||
                         errorMessage.includes('parsing')
    
    return NextResponse.json({
      status: isConfigError ? 'config_error' : 'error',
      message: isConfigError ? '数据库配置格式错误，建议重新配置' : '数据库健康检查失败',
      error: errorMessage,
      database: {
        configured: isDatabaseAvailable(),
        connection: { status: 'error', message: errorMessage },
        mode: isConfigError ? 'config_error' : 'database_error'
      },
      timestamp: new Date().toISOString()
    }, { status: 200 }) // 改为200状态码，避免前端报错
  }
} 