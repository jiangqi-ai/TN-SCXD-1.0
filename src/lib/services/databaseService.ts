// 攀岩设备下单系统数据库服务层
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ===== 用户管理服务 =====
export const databaseUserService = {
  // 创建用户
  async createUser(userData: {
    username: string
    email: string
    password: string
    name: string
    company?: string
    phone?: string
    address?: string
    role?: string
  }) {
    return await prisma.user.create({
      data: userData
    })
  },

  // 获取用户
  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })
  },

  // 登录验证
  async getUserByCredentials(username: string, password: string) {
    return await prisma.user.findFirst({
      where: {
        AND: [
          { username },
          { password },
          { isActive: true }
        ]
      }
    })
  },

  // 获取所有用户（管理员用）
  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true }
          }
        }
      }),
      prisma.user.count()
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  },

  // 更新最后登录时间
  async updateLastLogin(id: string) {
    return await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    })
  },

  // 更新用户信息
  async updateUser(id: string, userData: Partial<{
    name: string
    email: string
    phone: string
    company: string
    address: string
    isActive: boolean
  }>) {
    return await prisma.user.update({
      where: { id },
      data: userData
    })
  },

  // 删除用户
  async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id }
    })
  }
}

// ===== 产品管理服务 =====
export const databaseProductService = {
  // 创建产品
  async createProduct(productData: {
    name: string
    category: string
    brand?: string
    model?: string
    description?: string
    specifications?: string
    images: string
    price: number
    stock: number
    weight?: number
    size?: string
    colors?: string
    features?: string
    certifications?: string
    isActive?: boolean
    isFeatured?: boolean
    minOrderQty?: number
  }) {
    return await prisma.product.create({
      data: productData
    })
  },

  // 获取产品列表
  async getProducts(params: {
    page?: number
    limit?: number
    category?: string
    featured?: boolean
    search?: string
    sortBy?: 'price' | 'name' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      featured,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params

    const skip = (page - 1) * limit
    
    // 构建查询条件
    const where: any = {
      isActive: true
    }
    
    if (category) {
      where.category = category
    }
    
    if (featured !== undefined) {
      where.isFeatured = featured
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.product.count({ where })
    ])

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  },

  // 获取单个产品
  async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id }
    })
  },

  // 更新库存
  async updateStock(id: string, quantity: number) {
    return await prisma.product.update({
      where: { id },
      data: {
        stock: {
          decrement: quantity
        }
      }
    })
  },

  // 获取推荐产品
  async getFeaturedProducts(limit = 6) {
    return await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  },

  // 按分类获取产品
  async getProductsByCategory(category: string, limit = 10) {
    return await prisma.product.findMany({
      where: {
        category,
        isActive: true
      },
      take: limit,
      orderBy: { price: 'asc' }
    })
  },

  // 更新产品
  async updateProduct(id: string, productData: Partial<{
    name: string
    category: string
    brand: string
    model: string
    description: string
    specifications: string
    images: string
    price: number
    stock: number
    weight: number
    size: string
    colors: string
    features: string
    certifications: string
    isActive: boolean
    isFeatured: boolean
    minOrderQty: number
  }>) {
    return await prisma.product.update({
      where: { id },
      data: productData
    })
  },

  // 删除产品
  async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id }
    })
  }
}

// ===== 订单管理服务 =====
export const databaseOrderService = {
  // 创建订单
  async createOrder(orderData: {
    userId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    customerCompany?: string
    shippingAddress: string
    notes?: string
    items: Array<{
      productId: string
      productName: string
      productSpec?: string
      quantity: number
      unitPrice: number
    }>
    subtotal: number
    shippingCost: number
    totalAmount: number
    paymentMethod?: string
  }) {
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    return await prisma.$transaction(async (tx) => {
      // 创建订单
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: orderData.userId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          customerCompany: orderData.customerCompany,
          shippingAddress: orderData.shippingAddress,
          notes: orderData.notes,
          subtotal: orderData.subtotal,
          shippingCost: orderData.shippingCost,
          totalAmount: orderData.totalAmount,
          paymentMethod: orderData.paymentMethod || 'cod'
        }
      })

      // 创建订单项并更新库存
      for (const item of orderData.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            productSpec: item.productSpec,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice
          }
        })

        // 更新产品库存
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      return order
    })
  },

  // 获取订单详情
  async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  },

  // 获取用户订单
  async getUserOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      prisma.order.count({ where: { userId } })
    ])

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  },

  // 获取所有订单（管理员用）
  async getAllOrders(params: {
    page?: number
    limit?: number
    status?: string
    search?: string
  } = {}) {
    const { page = 1, limit = 20, status, search } = params
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  },

  // 更新订单状态
  async updateOrderStatus(id: string, status: string) {
    const updateData: any = { status }
    
    switch (status) {
      case 'confirmed':
        updateData.confirmedAt = new Date()
        break
      case 'shipped':
        updateData.shippedAt = new Date()
        break
      case 'delivered':
        updateData.deliveredAt = new Date()
        break
      case 'cancelled':
        updateData.cancelledAt = new Date()
        break
    }

    return await prisma.order.update({
      where: { id },
      data: updateData
    })
  },

  // 获取订单统计
  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'confirmed' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.count({ where: { status: 'delivered' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['confirmed', 'shipped', 'delivered'] } }
      })
    ])

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0
    }
  }
}

// ===== 系统设置服务 =====
export const databaseSettingService = {
  // 获取设置
  async getSetting(key: string) {
    const setting = await prisma.setting.findUnique({
      where: { key }
    })
    return setting ? setting.value : null
  },

  // 设置值
  async setSetting(key: string, value: string, description?: string, isPublic = false) {
    return await prisma.setting.upsert({
      where: { key },
      update: { value, description, isPublic },
      create: { key, value, description, isPublic }
    })
  },

  // 获取所有公开设置
  async getPublicSettings() {
    const settings = await prisma.setting.findMany({
      where: { isPublic: true }
    })
    
    const result: Record<string, any> = {}
    settings.forEach(setting => {
      try {
        result[setting.key] = JSON.parse(setting.value)
      } catch {
        result[setting.key] = setting.value
      }
    })
    
    return result
  },

  // 获取所有设置（管理员用）
  async getAllSettings() {
    return await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    })
  }
}

// ===== 数据库连接和健康检查 =====
export const databaseHealthService = {
  // 检查数据库连接
  async checkConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'connected', message: '数据库连接正常' }
    } catch (error) {
      console.error('数据库连接检查失败:', error)
      return { status: 'error', message: '数据库连接失败', error: error.message }
    }
  },

  // 获取数据库统计信息
  async getStats() {
    try {
      const [
        userCount,
        productCount,
        orderCount,
        activeProductCount
      ] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.product.count({ where: { isActive: true } })
      ])

      return {
        users: userCount,
        products: productCount,
        orders: orderCount,
        activeProducts: activeProductCount
      }
    } catch (error) {
      console.error('获取数据库统计失败:', error)
      throw error
    }
  }
}

// 断开数据库连接（应用关闭时调用）
export async function disconnectDatabase() {
  await prisma.$disconnect()
} 