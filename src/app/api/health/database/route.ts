import { NextResponse } from 'next/server'
import { databaseHealthService, databaseProductService, databaseOrderService } from '@/lib/services/databaseService'

export async function GET() {
  try {
    // 检查数据库连接
    const connectionStatus = await databaseHealthService.checkConnection()
    
    if (connectionStatus.status === 'error') {
      return NextResponse.json({
        status: 'error',
        message: '数据库连接失败',
        error: connectionStatus.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
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
        connection: connectionStatus,
        stats,
        sampleData: {
          featuredProducts: featuredProducts.length,
          recentOrders: recentOrders.orders.length
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('数据库健康检查失败:', error)
    
    return NextResponse.json({
      status: 'error',
      message: '数据库健康检查失败',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 