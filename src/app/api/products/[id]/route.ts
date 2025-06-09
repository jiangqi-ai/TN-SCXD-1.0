import { productService } from '@/lib/services/hybridProductService'
import { NextResponse } from 'next/server'

// 获取单个产品
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🔄 Products API: 获取产品 ${id}`)
    
    const product = await productService.getById(id)
    
    if (!product) {
      return NextResponse.json(
        { error: '产品不存在' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Products API: 成功获取产品 ${id}`)
    return NextResponse.json(product)
  } catch (error) {
    console.error('❌ Products API get error:', error)
    const errorMessage = error instanceof Error ? error.message : '获取产品失败'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// 更新产品
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🔄 Products API: 更新产品 ${id}`)
    
    const updateData = await request.json()
    const updatedProduct = await productService.update(id, updateData)
    
    console.log(`✅ Products API: 产品更新成功 ${id}`)
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('❌ Products API update error:', error)
    const errorMessage = error instanceof Error ? error.message : '更新产品失败'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// 删除产品
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🔄 Products API: 删除产品 ${id}`)
    
    // 先检查产品是否存在
    const product = await productService.getById(id)
    if (!product) {
      console.log(`❌ 产品不存在: ${id}`)
      return NextResponse.json(
        { error: '产品不存在' },
        { status: 404 }
      )
    }
    
    await productService.delete(id)
    
    console.log(`✅ Products API: 产品删除成功 ${id}`)
    return NextResponse.json({ message: '产品删除成功' })
  } catch (error) {
    console.error('❌ Products API delete error:', error)
    const errorMessage = error instanceof Error ? error.message : '删除产品失败'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 