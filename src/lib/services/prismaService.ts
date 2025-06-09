import { PrismaClient } from '@prisma/client'
import { isVercelEnvironment } from './vercelCompat'

// 创建 Prisma 客户端单例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在Vercel环境下，禁用Prisma或使用更安全的配置
let prisma: PrismaClient | null = null

try {
  if (!isVercelEnvironment()) {
    prisma = globalForPrisma.prisma ?? new PrismaClient()
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  }
} catch (error) {
  console.warn('Prisma客户端初始化失败，将使用localStorage:', error)
  prisma = null
}

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
          name: 'PYQ-001',
          category: 'indoor',
          brand: '攀岩先锋',
          model: 'beginner',
          description: '入门级攀岩墙，适合初学者',
          specifications: '适合健身房、学校、社区中心',
          images: '/api/placeholder/400/300',
          price: 1500.0,
          stock: 100,
          weight: 50.0,
          size: '2m x 3m',
          colors: '红色,蓝色,绿色,黄色',
          features: '防滑表面,安全认证,易安装',
          certifications: 'ISO9001,CE',
          isActive: true,
          isFeatured: true,
          minOrderQty: 1
        },
        {
          name: 'PYQ-002',
          category: 'indoor',
          brand: '攀岩先锋',
          model: 'professional',
          description: '专业级攀岩墙，适合有经验的攀岩者',
          specifications: '适合专业攀岩馆、体育中心',
          images: '/api/placeholder/400/300',
          price: 2800.0,
          stock: 50,
          weight: 85.0,
          size: '3m x 5m',
          colors: '岩石灰,森林绿,天空蓝',
          features: '专业握点,可调节角度,安全保护',
          certifications: 'ISO9001,CE,UIAA',
          isActive: true,
          isFeatured: true,
          minOrderQty: 1
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
        user: true
      }
    })
  },

  async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true
      }
    })
  },

  async updateOrder(id: string, orderData: any) {
    return await prisma.order.update({
      where: { id },
      data: orderData,
      include: {
        items: true,
        user: true
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
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: true
      }
    })
  }
} 