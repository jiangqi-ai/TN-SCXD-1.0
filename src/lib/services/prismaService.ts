import { PrismaClient } from '@prisma/client'

// 创建 Prisma 客户端单例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }

// 数据库初始化和种子数据
export async function initializeDatabase() {
  try {
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
    }

    console.log('数据库初始化完成')
    return true
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return false
  }
}

// 用户相关服务
export const userService = {
  async createUser(userData: any) {
    return await prisma.user.create({ data: userData })
  },

  async getUserByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username }
    })
  },

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id }
    })
  },

  async updateUser(id: string, userData: any) {
    return await prisma.user.update({
      where: { id },
      data: userData
    })
  },

  async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id }
    })
  },

  async getAllUsers() {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }
}

// 产品相关服务
export const dbProductService = {
  async createProduct(productData: any) {
    return await prisma.product.create({ data: productData })
  },

  async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id }
    })
  },

  async updateProduct(id: string, productData: any) {
    return await prisma.product.update({
      where: { id },
      data: productData
    })
  },

  async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id }
    })
  },

  async getAllProducts() {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
  }
}

// 订单相关服务
export const dbOrderService = {
  async createOrder(orderData: any) {
    return await prisma.order.create({
      data: orderData,
      include: {
        items: true,
        customer: true
      }
    })
  },

  async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true
      }
    })
  },

  async updateOrder(id: string, orderData: any) {
    return await prisma.order.update({
      where: { id },
      data: orderData,
      include: {
        items: true,
        customer: true
      }
    })
  },

  async deleteOrder(id: string) {
    return await prisma.order.delete({
      where: { id }
    })
  },

  async getAllOrders() {
    return await prisma.order.findMany({
      include: {
        items: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }
} 