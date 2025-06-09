import { productService } from '@/lib/services/hybridProductService'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    console.log('🔄 Products API: 开始获取产品列表')
    const { searchParams } = new URL(request.url)
    const admin = searchParams.get('admin')
    
    let products;
    if (admin === 'true') {
      console.log('📊 Products API: 获取管理员产品列表')
      products = await productService.getAllForAdmin()
    } else {
      console.log('👥 Products API: 获取普通产品列表')
      products = await productService.getAll()
    }
    
    console.log(`✅ Products API: 成功获取 ${products.length} 个产品`)
    return NextResponse.json(products)
  } catch (error) {
    console.error('❌ Products API error:', error)
    const errorMessage = error instanceof Error ? error.message : '获取产品列表失败'
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
} 