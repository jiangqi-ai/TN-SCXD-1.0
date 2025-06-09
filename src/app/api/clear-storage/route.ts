import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🗑️ 开始清空localStorage数据...')
    
    // 注意：这个API在服务端运行，不能直接访问localStorage
    // 需要返回指令让前端清空localStorage
    
    return NextResponse.json({
      message: '请在前端执行清空操作',
      instructions: [
        'localStorage.removeItem("products")',
        'localStorage.removeItem("orders")', 
        'localStorage.removeItem("users")',
        'localStorage.removeItem("contracts")',
        'localStorage.clear() // 清空所有数据'
      ],
      success: true
    })
  } catch (error) {
    console.error('❌ 清空存储失败:', error)
    return NextResponse.json(
      { error: '清空存储失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '清空localStorage数据',
    usage: 'POST请求来清空数据',
    note: '这将清空所有本地存储的产品、订单、用户和合同数据'
  })
} 