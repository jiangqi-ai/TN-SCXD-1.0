import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initializeDatabase() {
  try {
    console.log('开始初始化数据库...')
    
    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 检查是否已有管理员用户
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    })

    if (!adminUser) {
      // 创建默认管理员用户
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123', // 在实际应用中应该加密
          role: 'admin',
          name: '系统管理员',
          company: '攀岩墙定制公司',
          phone: '13800138000',
          address: '上海市浦东新区',
          isActive: true
        }
      })
      console.log('✅ 创建默认管理员用户')
    }

    // 检查是否已有示例客户
    const customerUser = await prisma.user.findUnique({
      where: { username: 'customer' }
    })

    if (!customerUser) {
      // 创建默认客户用户
      await prisma.user.create({
        data: {
          username: 'customer',
          email: 'customer@example.com',
          password: 'customer123', // 在实际应用中应该加密
          role: 'customer',
          name: '张三',
          company: '上海体育馆',
          phone: '13900139000',
          address: '上海市静安区',
          customerType: 'gym',
          isActive: true
        }
      })
      console.log('✅ 创建默认客户用户')
    }

    // 检查是否已有产品数据
    const productCount = await prisma.product.count()
    
    if (productCount === 0) {
      // 创建示例产品
      const sampleProducts = [
        {
          productCode: 'PYQ-001',
          image: '/api/placeholder/400/300',
          availableDimensions: JSON.stringify(['2m x 3m', '3m x 4m', '4m x 5m']),
          weight: 50.0,
          pieceCount: 12,
          minimumOrderQty: 1,
          availableColors: JSON.stringify(['红色', '蓝色', '绿色', '黄色']),
          unitPrice: 1500.0,
          remarks: '入门级攀岩墙，适合初学者',
          features: JSON.stringify(['防滑表面', '安全认证', '易安装']),
          applications: '健身房、学校、社区中心',
          category: 'indoor',
          subCategory: 'beginner',
          targetCustomers: JSON.stringify(['gym', 'school', 'community']),
          discountable: true,
          maxDiscount: 10.0,
          isActive: true
        },
        {
          productCode: 'PYQ-002',
          image: '/api/placeholder/400/300',
          availableDimensions: JSON.stringify(['3m x 5m', '4m x 6m', '5m x 8m']),
          weight: 85.0,
          pieceCount: 20,
          minimumOrderQty: 1,
          availableColors: JSON.stringify(['岩石灰', '森林绿', '天空蓝']),
          unitPrice: 2800.0,
          remarks: '专业级攀岩墙，适合有经验的攀岩者',
          features: JSON.stringify(['专业握点', '可调节角度', '安全保护']),
          applications: '专业攀岩馆、体育中心',
          category: 'indoor',
          subCategory: 'professional',
          targetCustomers: JSON.stringify(['gym', 'sports_center']),
          discountable: true,
          maxDiscount: 15.0,
          isActive: true
        }
      ]

      for (const product of sampleProducts) {
        await prisma.product.create({ data: product })
      }
      console.log('✅ 创建示例产品数据')
    }

    console.log('✅ 数据库初始化完成！')
    console.log('默认管理员账号: admin / admin123')
    console.log('默认客户账号: customer / customer123')
    console.log('可以通过 http://localhost:5555 访问 Prisma Studio 查看数据')
    
    return true
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    console.error('错误详情:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// 运行初始化
initializeDatabase().then((success) => {
  process.exit(success ? 0 : 1)
}) 