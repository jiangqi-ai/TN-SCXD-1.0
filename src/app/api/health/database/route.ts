import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // 测试数据库连接
    await prisma.$connect()
    
    // 执行简单查询测试
    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()
    
    // 获取数据库信息
    const databaseUrl = process.env.DATABASE_URL || ''
    const provider = databaseUrl.startsWith('postgresql') ? 'PostgreSQL' : 
                    databaseUrl.startsWith('file:') ? 'SQLite' : 'Unknown'
    
    return NextResponse.json({
      status: 'healthy',
      database: {
        provider,
        connected: true,
        stats: {
          users: userCount,
          products: productCount
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 