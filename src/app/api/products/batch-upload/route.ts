import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/services/hybridProductService'
import { initializeEnvironment } from '@/lib/services/vercelCompat'

export async function POST(request: NextRequest) {
  try {
    // 确保环境变量正确初始化
    initializeEnvironment()
    
    const body = await request.json()
    const { products } = body
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: '无效的产品数据' },
        { status: 400 }
      )
    }

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: '产品列表不能为空' },
        { status: 400 }
      )
    }

    console.log(`[API] 开始批量上传 ${products.length} 个产品`)
    
    // 调用批量上传服务
    await productService.uploadFromExcel(products)
    
    console.log(`[API] 批量上传成功完成`)
    
    return NextResponse.json({
      success: true,
      message: `成功上传 ${products.length} 个产品`,
      count: products.length
    })
    
  } catch (error) {
    console.error('[API] 批量上传失败:', error)
    
    let errorMessage = '批量上传失败'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
} 