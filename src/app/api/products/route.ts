import { databaseProductService } from '@/lib/services/databaseService'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    console.log('🔄 Products API: 开始获取产品列表')
    const { searchParams } = new URL(request.url)
    const admin = searchParams.get('admin')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (admin === 'true') {
      console.log('📊 Products API: 获取管理员产品列表')
      // 管理员获取所有产品（包括未激活的）
      const result = await databaseProductService.getProducts({
        page,
        limit,
        category: category || undefined,
        featured: featured ? featured === 'true' : undefined,
        search: search || undefined
      })
      
      console.log(`✅ Products API: 成功获取 ${result.products.length} 个产品`)
      return NextResponse.json(result.products)
    } else {
      console.log('👥 Products API: 获取普通产品列表')
      // 普通用户只获取激活的产品
      const result = await databaseProductService.getProducts({
        page,
        limit,
        category: category || undefined,
        featured: featured ? featured === 'true' : undefined,
        search: search || undefined
      })
      
      console.log(`✅ Products API: 成功获取 ${result.products.length} 个产品`)
      return NextResponse.json(result.products)
    }
  } catch (error) {
    console.error('❌ Products API error:', error)
    const errorMessage = error instanceof Error ? error.message : '获取产品列表失败'
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔄 Products API: 开始创建产品')
    const productData = await request.json()
    
    const newProduct = await databaseProductService.createProduct(productData)
    
    console.log('✅ Products API: 产品创建成功')
    return NextResponse.json(newProduct)
  } catch (error) {
    console.error('❌ Products API create error:', error)
    const errorMessage = error instanceof Error ? error.message : '创建产品失败'
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
} 