import { productService } from '@/lib/services/hybridProductService'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 Toggle API: 开始切换产品状态')
    const { isActive } = await request.json()
    const { id } = await params
    
    console.log(`🔄 Toggle API: 切换产品 ${id} 状态为 ${isActive}`)
    
    // 先检查产品是否存在
    const product = await productService.getById(id)
    if (!product) {
      console.log(`❌ Toggle API: 产品不存在 ${id}`)
      return NextResponse.json(
        { error: '产品不存在' },
        { status: 404 }
      )
    }
    
    // 更新产品状态
    await productService.update(id, { isActive })
    
    console.log(`✅ Toggle API: 产品状态更新成功 ${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Toggle product status error:', error)
    const errorMessage = error instanceof Error ? error.message : '更新产品状态失败'
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
} 