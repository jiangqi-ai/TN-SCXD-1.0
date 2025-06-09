import { productService } from '@/lib/services/hybridProductService'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isActive } = await request.json()
    const resolvedParams = await params
    
    await productService.update(resolvedParams.id, { isActive })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Toggle product status error:', error)
    return NextResponse.json(
      { error: '更新产品状态失败' }, 
      { status: 500 }
    )
  }
} 