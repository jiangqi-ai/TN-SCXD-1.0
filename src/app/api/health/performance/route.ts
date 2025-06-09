import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // 模拟数据库查询性能
    const dbStart = Date.now()
    // 这里可以添加实际的数据库查询
    const dbDuration = Date.now() - dbStart
    
    // 内存使用情况（仅在Node.js环境中可用）
    const memoryUsage = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : null
    
    // 计算总响应时间
    const totalDuration = Date.now() - startTime
    
    const performanceData = {
      timestamp: new Date().toISOString(),
      responseTime: totalDuration,
      database: {
        queryTime: dbDuration,
        connected: true, // 这里应该检查实际的数据库连接状态
      },
      memory: memoryUsage ? {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      } : null,
      recommendations: []
    }
    
    // 性能建议
    if (totalDuration > 1000) {
      performanceData.recommendations.push('API响应时间较慢，建议优化查询逻辑')
    }
    
    if (memoryUsage && memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
      performanceData.recommendations.push('内存使用较高，建议优化内存管理')
    }
    
    if (dbDuration > 500) {
      performanceData.recommendations.push('数据库查询时间较长，建议添加索引或优化查询')
    }
    
    const response = NextResponse.json({
      status: 'ok',
      performance: performanceData
    })
    
    // 添加缓存头部，但缓存时间较短
    response.headers.set('Cache-Control', 'private, max-age=10')
    
    return response
  } catch (error) {
    console.error('Performance check error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : '性能检查失败'
      }, 
      { status: 500 }
    )
  }
} 