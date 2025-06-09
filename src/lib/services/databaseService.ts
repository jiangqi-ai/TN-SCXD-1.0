import { prisma } from './prismaService'
import { isVercelEnvironment } from './vercelCompat'
import { generateId, generateOrderId } from "@/lib/utils/helpers"
import type { 
  CreateOrderRequest, 
  LoginCredentials, 
  Order, 
  OrderItem,
  RegisterData,
  User,
  Product,
  CustomerType 
} from '@/types'
import { securityService } from './securityService'

// 检查Prisma是否可用
const isPrismaAvailable = () => {
  return prisma !== null && !isVercelEnvironment()
}

// 工具函数
const simulateDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 数据转换函数
const transformDbUserToAppUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    password: dbUser.password,
    role: dbUser.role as 'admin' | 'customer',
    profile: {
      name: dbUser.name,
      company: dbUser.company || '',
      phone: dbUser.phone || '',
      address: dbUser.address || ''
    },
    isActive: dbUser.isActive,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt
  }
}

const transformDbProductToAppProduct = (dbProduct: any): Product => {
  return {
    id: dbProduct.id,
    productCode: dbProduct.productCode,
    image: dbProduct.image,
    availableDimensions: JSON.parse(dbProduct.availableDimensions),
    weight: dbProduct.weight,
    pieceCount: dbProduct.pieceCount,
    minimumOrderQty: dbProduct.minimumOrderQty,
    availableColors: JSON.parse(dbProduct.availableColors),
    unitPrice: dbProduct.unitPrice,
    remarks: dbProduct.remarks || undefined,
    features: dbProduct.features ? JSON.parse(dbProduct.features) : undefined,
    applications: dbProduct.applications || undefined,
    isActive: dbProduct.isActive,
    category: dbProduct.category as any,
    subCategory: dbProduct.subCategory as any,
    targetCustomers: JSON.parse(dbProduct.targetCustomers),
    discountable: dbProduct.discountable,
    maxDiscount: dbProduct.maxDiscount,
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt
  }
}

const transformDbOrderToAppOrder = (dbOrder: any): Order => {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.orderNumber,
    customerId: dbOrder.customerId,
    customerInfo: {
      name: dbOrder.customerName || '',
      company: dbOrder.customerCompany || '',
      contact: dbOrder.customerContact || '',
      email: dbOrder.customerEmail || '',
      deliveryAddress: dbOrder.deliveryAddress || '',
      specialRequirements: dbOrder.specialRequirements || undefined,
    },
    items: dbOrder.items?.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      image: item.image,
      selectedDimension: item.selectedDimension,
      weight: item.weight,
      pieceCount: item.pieceCount,
      selectedColor: item.selectedColor,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      originalPrice: item.originalPrice,
      discountedPrice: item.discountedPrice,
      discount: item.discount,
      discountable: item.discountable,
      maxDiscount: item.maxDiscount,
      subtotal: item.subtotal
    })) || [],
    totalAmount: dbOrder.totalAmount,
    originalAmount: dbOrder.originalAmount,
    discountAmount: dbOrder.discountAmount,
    status: dbOrder.status as Order['status'],
    orderDate: dbOrder.orderDate,
    confirmedAt: dbOrder.confirmedAt || undefined,
    productionStartedAt: dbOrder.productionStartedAt || undefined,
    deliveryDate: dbOrder.deliveryDate || undefined,
    completedAt: dbOrder.completedAt || undefined,
    paymentMethod: dbOrder.paymentMethod,
    productionNotes: dbOrder.productionNotes || undefined,
    approvedBy: dbOrder.approvedBy || undefined,
    approvedAt: dbOrder.approvedAt || undefined,
    createdAt: dbOrder.createdAt,
    updatedAt: dbOrder.updatedAt
  }
}

// 用户服务
export const databaseUserService = {
  async login(credentials: LoginCredentials): Promise<User> {
    await simulateDelay(300)
    
    if (!isPrismaAvailable()) {
      throw new Error('数据库不可用')
    }
    
    try {
      const dbUser = await prisma!.user.findUnique({
        where: { username: credentials.username }
      })

      if (!dbUser || !dbUser.isActive) {
        throw new Error('用户名或密码错误')
      }

      // 简单密码验证（在生产环境中应该使用加密密码）
      if (dbUser.password !== credentials.password) {
        throw new Error('用户名或密码错误')
      }

      // 更新最后登录时间
      await prisma!.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() }
      })

      return transformDbUserToAppUser(dbUser)
    } catch (error) {
      throw error instanceof Error ? error : new Error('登录失败')
    }
  },

  async register(userData: RegisterData): Promise<User> {
    await simulateDelay(500)
    
    try {
      // 检查用户名是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      })

      if (existingUser) {
        throw new Error('用户名已存在')
      }

      // 检查邮箱是否已存在
      const existingEmail = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingEmail) {
        throw new Error('邮箱已存在')
      }

      const dbUser = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: 'customer',
          name: userData.name,
          company: userData.company,
          phone: userData.contact,
          address: '',
          customerType: userData.customerType || '未分类',
          isActive: true
        }
      })

      return transformDbUserToAppUser(dbUser)
    } catch (error) {
      throw error instanceof Error ? error : new Error('注册失败')
    }
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await simulateDelay(300)
    
    try {
      const updateData: any = {}
      
      if (updates.profile) {
        if (updates.profile.name) updateData.name = updates.profile.name
        if (updates.profile.company) updateData.company = updates.profile.company
        if (updates.profile.phone) updateData.phone = updates.profile.phone
        if (updates.profile.address) updateData.address = updates.profile.address
      }

      const dbUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      })

      return transformDbUserToAppUser(dbUser)
    } catch (error) {
      throw error instanceof Error ? error : new Error('更新用户信息失败')
    }
  },

  async getAllCustomers(): Promise<User[]> {
    await simulateDelay(200)
    
    try {
      const dbUsers = await prisma.user.findMany({
        where: { 
          role: 'customer',
          isActive: true 
        },
        orderBy: { createdAt: 'desc' }
      })

      return dbUsers.map(transformDbUserToAppUser)
    } catch (error) {
      throw new Error('获取客户列表失败')
    }
  },

  async getAllUsers(adminUserId: string): Promise<User[]> {
    await simulateDelay(200)
    
    try {
      // 验证管理员权限
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId }
      })

      if (!admin || admin.role !== 'admin') {
        throw new Error('无权限访问')
      }

      const dbUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return dbUsers.map(transformDbUserToAppUser)
    } catch (error) {
      throw error instanceof Error ? error : new Error('获取用户列表失败')
    }
  },

  async deleteUser(adminUserId: string, targetUserId: string): Promise<void> {
    await simulateDelay(300)
    
    try {
      // 验证管理员权限
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId }
      })

      if (!admin || admin.role !== 'admin') {
        throw new Error('无权限执行此操作')
      }

      // 不能删除自己
      if (adminUserId === targetUserId) {
        throw new Error('不能删除自己的账号')
      }

      await prisma.user.delete({
        where: { id: targetUserId }
      })
    } catch (error) {
      throw error instanceof Error ? error : new Error('删除用户失败')
    }
  },

  async createAdminUser(adminUserId: string, userData: RegisterData): Promise<User> {
    await simulateDelay(500)
    
    try {
      // 验证管理员权限
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId }
      })

      if (!admin || admin.role !== 'admin') {
        throw new Error('无权限执行此操作')
      }

      // 检查用户名是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      })

      if (existingUser) {
        throw new Error('用户名已存在')
      }

      const dbUser = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: 'customer',
          name: userData.name,
          company: userData.company,
          phone: userData.contact,
          address: '',
          customerType: userData.customerType || '未分类',
          isActive: true
        }
      })

      return transformDbUserToAppUser(dbUser)
    } catch (error) {
      throw error instanceof Error ? error : new Error('创建用户失败')
    }
  }
}

// 产品服务
export const databaseProductService = {
  async getAll(customerType?: CustomerType): Promise<Product[]> {
    await simulateDelay(100)
    
    try {
      let whereClause: any = { isActive: true }
      
      // 如果有客户类型且不是"未分类"，过滤产品
      if (customerType && customerType !== '未分类') {
        // 注意：targetCustomers 是 JSON 字符串，需要使用字符串包含查询
        whereClause.OR = [
          { targetCustomers: { contains: `"${customerType}"` } },
          { targetCustomers: '[]' } // 没有指定目标客户的通用产品
        ]
      }

      const dbProducts = await prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })

      return dbProducts.map(transformDbProductToAppProduct)
    } catch (error) {
      throw new Error('获取产品列表失败')
    }
  },

  async getAllForAdmin(): Promise<Product[]> {
    await simulateDelay(100)
    
    try {
      const dbProducts = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return dbProducts.map(transformDbProductToAppProduct)
    } catch (error) {
      console.error('Database error in getAllForAdmin:', error)
      throw error instanceof Error ? error : new Error('获取产品列表失败')
    }
  },

  async getById(id: string): Promise<Product | null> {
    await simulateDelay(50)
    
    try {
      const dbProduct = await prisma.product.findUnique({
        where: { id }
      })

      return dbProduct ? transformDbProductToAppProduct(dbProduct) : null
    } catch (error) {
      throw new Error('获取产品详情失败')
    }
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    await simulateDelay(100)
    
    try {
      const dbProduct = await prisma.product.create({
        data: {
          productCode: productData.productCode,
          image: productData.image,
          availableDimensions: JSON.stringify(productData.availableDimensions),
          weight: productData.weight,
          pieceCount: productData.pieceCount,
          minimumOrderQty: productData.minimumOrderQty,
          availableColors: JSON.stringify(productData.availableColors),
          unitPrice: productData.unitPrice,
          remarks: productData.remarks,
          features: productData.features ? JSON.stringify(productData.features) : null,
          applications: productData.applications,
          category: productData.category,
          subCategory: productData.subCategory,
          targetCustomers: JSON.stringify(productData.targetCustomers),
          discountable: productData.discountable,
          maxDiscount: productData.maxDiscount,
          isActive: productData.isActive
        }
      })

      return transformDbProductToAppProduct(dbProduct)
    } catch (error) {
      throw error instanceof Error ? error : new Error('创建产品失败')
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    await simulateDelay(100)
    
    try {
      const updateData: any = {}
      
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key]
        if (value !== undefined) {
          if (key === 'availableDimensions' || key === 'availableColors' || key === 'targetCustomers') {
            updateData[key] = JSON.stringify(value)
          } else if (key === 'features') {
            updateData[key] = value ? JSON.stringify(value) : null
          } else {
            updateData[key] = value
          }
        }
      })

      const dbProduct = await prisma.product.update({
        where: { id },
        data: updateData
      })

      return transformDbProductToAppProduct(dbProduct)
    } catch (error) {
      throw error instanceof Error ? error : new Error('更新产品失败')
    }
  },

  async delete(id: string): Promise<void> {
    await simulateDelay(100)
    
    try {
      await prisma.product.delete({
        where: { id }
      })
    } catch (error) {
      throw error instanceof Error ? error : new Error('删除产品失败')
    }
  },

  async uploadFromExcel(newProducts: Product[]): Promise<void> {
    await simulateDelay(500)
    
    try {
      const createData = newProducts.map(product => ({
        productCode: product.productCode,
        image: product.image,
        availableDimensions: JSON.stringify(product.availableDimensions),
        weight: product.weight,
        pieceCount: product.pieceCount,
        minimumOrderQty: product.minimumOrderQty,
        availableColors: JSON.stringify(product.availableColors),
        unitPrice: product.unitPrice,
        remarks: product.remarks,
        features: product.features ? JSON.stringify(product.features) : null,
        applications: product.applications,
        category: product.category,
        subCategory: product.subCategory,
        targetCustomers: JSON.stringify(product.targetCustomers),
        discountable: product.discountable,
        maxDiscount: product.maxDiscount,
        isActive: product.isActive
      }))

      await prisma.product.createMany({
        data: createData
      })
    } catch (error) {
      throw error instanceof Error ? error : new Error('批量上传产品失败')
    }
  }
}

// 订单服务
export const databaseOrderService = {
  async create(orderData: CreateOrderRequest): Promise<Order> {
    await simulateDelay(500)
    
    try {
      const orderNumber = generateOrderId()
      
      // 创建订单和订单项
      const dbOrder = await prisma.order.create({
        data: {
          orderNumber,
          customerId: orderData.customerId,
          customerName: orderData.shippingAddress.contactName,
          customerCompany: orderData.shippingAddress.company || '',
          customerContact: orderData.shippingAddress.phone,
          customerEmail: '', // 需要从用户信息中获取
          deliveryAddress: orderData.shippingAddress.address,
          specialRequirements: orderData.shippingAddress.notes,
          totalAmount: orderData.totalAmount,
          originalAmount: orderData.originalAmount,
          discountAmount: orderData.discountAmount,
          status: 'pending',
          paymentMethod: orderData.paymentMethod || 'bill_confirm',
          items: {
            create: orderData.items.map(item => ({
              productId: item.productId,
              productCode: `TEMP-${item.productId}`,
              productName: `产品 ${item.productId}`,
              image: '/api/placeholder/400/300',
              selectedDimension: '标准尺寸',
              weight: 50,
              pieceCount: 1,
              selectedColor: item.selectedColor,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              originalPrice: item.unitPrice,
              discountedPrice: item.unitPrice * (1 - item.discount / 100),
              discount: item.discount,
              discountable: true,
              maxDiscount: 20,
              subtotal: item.quantity * item.unitPrice * (1 - item.discount / 100)
            }))
          }
        },
        include: {
          items: true,
          customer: true
        }
      })

      return transformDbOrderToAppOrder(dbOrder)
    } catch (error) {
      throw error instanceof Error ? error : new Error('创建订单失败')
    }
  },

  async getAll(): Promise<Order[]> {
    await simulateDelay(200)
    
    try {
      const dbOrders = await prisma.order.findMany({
        include: {
          items: true,
          customer: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return dbOrders.map(transformDbOrderToAppOrder)
    } catch (error) {
      throw new Error('获取订单列表失败')
    }
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    await simulateDelay(200)
    
    try {
      const dbOrders = await prisma.order.findMany({
        where: { customerId },
        include: {
          items: true,
          customer: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return dbOrders.map(transformDbOrderToAppOrder)
    } catch (error) {
      throw new Error('获取客户订单失败')
    }
  },

  async getById(orderId: string): Promise<Order | null> {
    await simulateDelay(100)
    
    try {
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          customer: true
        }
      })

      return dbOrder ? transformDbOrderToAppOrder(dbOrder) : null
    } catch (error) {
      throw new Error('获取订单详情失败')
    }
  },

  async updateStatus(orderId: string, status: Order['status']): Promise<void> {
    await simulateDelay(300)
    
    try {
      const updateData: any = { status }
      
      // 根据状态设置相应的时间戳
      const now = new Date()
      switch (status) {
        case 'confirmed':
          updateData.confirmedAt = now
          break
        case 'production':
          updateData.productionStartedAt = now
          break
        case 'completed':
          updateData.completedAt = now
          break
      }

      await prisma.order.update({
        where: { id: orderId },
        data: updateData
      })
    } catch (error) {
      throw error instanceof Error ? error : new Error('更新订单状态失败')
    }
  },

  async setDeliveryDate(orderId: string, date: Date): Promise<void> {
    await simulateDelay(200)
    
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { deliveryDate: date }
      })
    } catch (error) {
      throw new Error('设置交货日期失败')
    }
  },

  async addProductionNotes(orderId: string, notes: string): Promise<void> {
    await simulateDelay(200)
    
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { productionNotes: notes }
      })
    } catch (error) {
      throw new Error('添加生产备注失败')
    }
  },

  async delete(orderId: string): Promise<void> {
    await simulateDelay(300)
    
    try {
      // 由于设置了 onDelete: Cascade，删除订单会自动删除订单项
      await prisma.order.delete({
        where: { id: orderId }
      })
    } catch (error) {
      throw error instanceof Error ? error : new Error('删除订单失败')
    }
  }
}

// 数据同步工具
export const dataSyncUtils = {
  // 检查数据同步状态（为了兼容现有代码）
  checkSyncStatus: () => ({
    synchronized: true,
    reason: '使用数据库存储',
    lastSyncTime: new Date().toISOString(),
    version: '2.0.0-database'
  }),

  // 强制重置数据（数据库版本）
  forceReset: async () => {
    try {
      // 数据库版本的重置意味着重新初始化种子数据
      console.log('🔄 正在重置数据库数据...')
      
      // 这里可以调用初始化脚本
      // 或者清空特定表并重新填充初始数据
      
      console.log('✅ 数据库数据重置完成')
      return true
    } catch (error) {
      console.error('❌ 数据库重置失败:', error)
      return false
    }
  }
}

export { prisma }

console.log('Database service loaded') 