import { productService } from '@/lib/services/hybridProductService'
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
    
    let products
    if (admin === 'true') {
      console.log('📊 Products API: 获取管理员产品列表')
      // 管理员获取所有产品（包括未激活的）
      products = await productService.getAllForAdmin()
    } else {
      console.log('👥 Products API: 获取普通产品列表')
      // 普通用户只获取激活的产品
      products = await productService.getAll()
    }

    // 应用筛选条件
    let filteredProducts = products.filter(product => product.isActive !== false)

    // 分类筛选
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(product => product.category === category)
    }

    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase()
      filteredProducts = filteredProducts.filter(product => 
        product.productCode.toLowerCase().includes(searchLower) ||
        product.remarks?.toLowerCase().includes(searchLower) ||
        product.availableDimensions.some(dim => dim.toLowerCase().includes(searchLower))
      )
    }

    // 特色产品筛选
    if (featured === 'true') {
      // 简单的特色产品逻辑：按价格排序取前几个
      filteredProducts = filteredProducts
        .sort((a, b) => b.unitPrice - a.unitPrice)
        .slice(0, limit)
    } else {
      // 分页处理
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      filteredProducts = filteredProducts.slice(startIndex, endIndex)
    }
    
    console.log(`✅ Products API: 成功获取 ${filteredProducts.length} 个产品`)
    
    // 添加缓存头部
    const response = NextResponse.json(filteredProducts)
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    
    return response
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
    
    const newProduct = await productService.create(productData)
    
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