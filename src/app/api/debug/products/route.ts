import { productService } from '@/lib/services/hybridProductService'
import { databaseProductService } from '@/lib/services/databaseService'
import { isDatabaseAvailable } from '@/lib/services/vercelCompat'
import { safeProductService } from '@/lib/services/databaseServiceSafe'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Debug: 开始详细调试...')
    
    const debugInfo: any = {
      message: '详细调试信息',
      storageMode: require('@/lib/services/hybridProductService').getStorageType(),
      databaseAvailable: isDatabaseAvailable(),
      sources: {}
    }
    
    // 1. 检查 hybridProductService
    try {
      const hybridProducts = await productService.getAllForAdmin()
      debugInfo.sources.hybrid = {
        count: hybridProducts.length,
        products: hybridProducts.map(p => ({ 
          id: p.id, 
          productCode: p.productCode,
          isActive: p.isActive
        }))
      }
      console.log('🔍 Hybrid产品数量:', hybridProducts.length)
    } catch (error) {
      debugInfo.sources.hybrid = { error: error instanceof Error ? error.message : '未知错误' }
    }
    
    // 2. 检查 databaseProductService（强制）
    try {
      const dbProducts = await databaseProductService.getProducts()
      debugInfo.sources.database = {
        count: dbProducts.products.length,
        products: dbProducts.products.map(p => ({ 
          id: p.id, 
          name: p.name,
          isActive: p.isActive
        }))
      }
      console.log('🔍 数据库产品数量:', dbProducts.products.length)
    } catch (error) {
      debugInfo.sources.database = { error: error instanceof Error ? error.message : '数据库错误' }
    }
    
    // 3. 检查 localStorage
    try {
      const localProducts = await safeProductService.getAllForAdmin()
      debugInfo.sources.localStorage = {
        count: localProducts.length,
        products: localProducts.map(p => ({ 
          id: p.id, 
          productCode: p.productCode,
          isActive: p.isActive
        }))
      }
      console.log('🔍 localStorage产品数量:', localProducts.length)
    } catch (error) {
      debugInfo.sources.localStorage = { error: error instanceof Error ? error.message : 'localStorage错误' }
    }
    
    console.log('🔍 Debug完整信息:', debugInfo)
    
    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json(
      { error: '调试信息获取失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
} 