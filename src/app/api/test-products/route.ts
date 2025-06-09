import { productService } from '@/lib/services/hybridProductService'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 测试产品服务...')
    
    // 创建一个测试产品
    const testProduct = {
      productCode: 'TEST-001',
      category: '岩点' as const,
      image: '',
      availableDimensions: ['20cm x 15cm x 10cm'],
      weight: 0.5,
      pieceCount: 1,
      minimumOrderQty: 1,
      availableColors: ['红色', '蓝色'],
      unitPrice: 50.00,
      remarks: '测试产品',
      features: ['高强度', '耐磨'],
      applications: '攀岩训练',
      isActive: true,
      targetCustomers: ['未分类' as const],
      discountable: true,
      maxDiscount: 10,
      subCategory: '玻璃钢境面' as const
    }
    
    console.log('📝 创建测试产品...')
    const createdProduct = await productService.create(testProduct)
    console.log('✅ 产品创建成功:', createdProduct.id)
    
    console.log('📋 获取所有产品...')
    const products = await productService.getAll()
    console.log('✅ 获取到产品数量:', products.length)
    
    console.log('🗑️ 删除测试产品...')
    await productService.delete(createdProduct.id)
    console.log('✅ 测试产品已删除')
    
    return NextResponse.json({
      success: true,
      message: '产品服务测试通过',
      test_results: {
        created_product_id: createdProduct.id,
        total_products: products.length,
        storage_type: 'localStorage'
      }
    })
    
  } catch (error) {
    console.error('❌ 产品服务测试失败:', error)
    return NextResponse.json({
      success: false,
      message: '产品服务测试失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 