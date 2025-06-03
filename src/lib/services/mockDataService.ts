import type { 
  Product, 
  User, 
  Order, 
  OrderItem,
  CreateOrderRequest, 
  LoginCredentials, 
  RegisterData 
} from '@/types';
import { generateId, generateOrderId } from "@/lib/utils/helpers";

// 从环境变量获取默认密码
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
const DEFAULT_CUSTOMER_PASSWORD = process.env.DEFAULT_CUSTOMER_PASSWORD || 'customer123';

// 模拟产品数据
let mockProducts: Product[] = [];

// 模拟用户数据
let mockUsers: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@example.com',
    password: DEFAULT_ADMIN_PASSWORD,
    role: 'admin',
    profile: {
      name: '管理员',
      company: '纸箱生产厂',
      phone: '13800138000',
      address: '工厂地址'
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'customer-1',
    username: 'customer1',
    email: 'customer1@example.com',
    password: DEFAULT_CUSTOMER_PASSWORD,
    role: 'customer',
    profile: {
      name: '张三',
      company: '某某贸易公司',
      phone: '13900139000',
      address: '上海市浦东新区'
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'customer-2',
    username: 'customer2',
    email: 'customer2@example.com',
    password: DEFAULT_CUSTOMER_PASSWORD,
    role: 'customer',
    profile: {
      name: '李四',
      company: '电商公司',
      phone: '13700137000',
      address: '北京市朝阳区'
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// 模拟订单数据
let mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    customerId: 'customer1',
    customerInfo: {
      name: '张三',
      company: '某攀岩俱乐部',
      contact: '13800138001',
      email: 'zhangsan@example.com',
      deliveryAddress: '北京市朝阳区某某路123号',
      specialRequirements: '请在周五前完成生产'
    },
    items: [
      {
        productId: '1',
        productCode: 'CW-001-30x30',
        productName: 'CW-001-30x30',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        selectedDimension: '30cm x 30cm x 5cm',
        weight: 2.5,
        pieceCount: 4,
        selectedColor: '红色',
        quantity: 10,
        unitPrice: 45.00,
        subtotal: 450.00
      },
      {
        productId: '2',
        productCode: 'CW-002-25x25',
        productName: 'CW-002-25x25',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        selectedDimension: '25cm x 25cm x 4cm',
        weight: 1.8,
        pieceCount: 6,
        selectedColor: '蓝色',
        quantity: 15,
        unitPrice: 38.00,
        subtotal: 570.00
      }
    ],
    totalAmount: 1020.00,
    status: 'production',
    orderDate: new Date('2025-01-10T09:30:00'),
    confirmedAt: new Date('2025-01-10T14:20:00'),
    productionStartedAt: new Date('2025-01-11T08:00:00'),
    deliveryDate: new Date('2025-01-15T00:00:00'),
    paymentMethod: 'bill_confirm',
    productionNotes: '客户要求加急处理',
    createdAt: new Date('2025-01-10T09:30:00'),
    updatedAt: new Date('2025-01-11T08:00:00')
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    customerId: 'customer1',
    customerInfo: {
      name: '张三',
      company: '某攀岩俱乐部',
      contact: '13800138001',
      email: 'zhangsan@example.com',
      deliveryAddress: '北京市朝阳区某某路123号'
    },
    items: [
      {
        productId: '3',
        productCode: 'CW-003-35x35',
        productName: 'CW-003-35x35',
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        selectedDimension: '35cm x 35cm x 6cm',
        weight: 3.2,
        pieceCount: 2,
        selectedColor: '绿色',
        quantity: 8,
        unitPrice: 55.00,
        subtotal: 440.00
      }
    ],
    totalAmount: 440.00,
    status: 'completed',
    orderDate: new Date('2025-01-08T11:15:00'),
    confirmedAt: new Date('2025-01-08T16:30:00'),
    productionStartedAt: new Date('2025-01-09T09:00:00'),
    deliveryDate: new Date('2025-01-12T00:00:00'),
    completedAt: new Date('2025-01-12T15:45:00'),
    paymentMethod: 'bill_confirm',
    createdAt: new Date('2025-01-08T11:15:00'),
    updatedAt: new Date('2025-01-12T15:45:00')
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    customerId: 'customer2',
    customerInfo: {
      name: '李四',
      company: '户外运动中心',
      contact: '13900139002',
      email: 'lisi@example.com',
      deliveryAddress: '上海市浦东新区某某街456号'
    },
    items: [
      {
        productId: '1',
        productCode: 'CW-001-30x30',
        productName: 'CW-001-30x30',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        selectedDimension: '30cm x 30cm x 5cm',
        weight: 2.5,
        pieceCount: 4,
        selectedColor: '黄色',
        quantity: 20,
        unitPrice: 45.00,
        subtotal: 900.00
      }
    ],
    totalAmount: 900.00,
    status: 'pending',
    orderDate: new Date('2025-01-12T10:00:00'),
    paymentMethod: 'bill_confirm',
    createdAt: new Date('2025-01-12T10:00:00'),
    updatedAt: new Date('2025-01-12T10:00:00')
  }
];

// 模拟延迟函数
const simulateDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 产品服务
export const mockProductService = {
  async getAll(): Promise<Product[]> {
    await simulateDelay(500);
    return mockProducts.filter(p => p.isActive);
  },

  async getById(id: string): Promise<Product | null> {
    await simulateDelay(200);
    return mockProducts.find(p => p.id === id) || null;
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    await simulateDelay(300);
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockProducts.push(newProduct);
    return newProduct;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    await simulateDelay(300);
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    const existingProduct = mockProducts[index];
    if (!existingProduct) throw new Error('Product not found');
    
    mockProducts[index] = { 
      ...existingProduct, 
      ...updates, 
      updatedAt: new Date() 
    };
    return mockProducts[index]!;
  },

  async delete(id: string): Promise<void> {
    await simulateDelay(300);
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    const product = mockProducts[index];
    if (product) {
      product.isActive = false;
    }
  },

  async uploadFromExcel(products: Product[]): Promise<void> {
    await simulateDelay(1000);
    mockProducts.push(...products);
  }
};

// 订单服务
export const mockOrderService = {
  async create(orderData: CreateOrderRequest): Promise<Order> {
    await simulateDelay(500);
    
    const orderNumber = generateOrderId();
    
    // 获取商品详细信息
    const orderItems: OrderItem[] = [];
    for (const item of orderData.items) {
      const product = mockProducts.find(p => p.id === item.productId);
      if (product) {
        orderItems.push({
          productId: item.productId,
          productCode: product.productCode,
          productName: product.productCode, // 使用产品编号作为名称
          image: product.image,
          selectedDimension: product.availableDimensions[0] || '',
          weight: product.weight,
          pieceCount: product.pieceCount,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
        });
      }
    }
    
    const newOrder: Order = {
      id: generateId(),
      orderNumber,
      customerId: orderData.customerId,
      customerInfo: {
        name: orderData.shippingAddress.contactName,
        company: orderData.shippingAddress.company || '',
        contact: orderData.shippingAddress.phone,
        email: '',
        deliveryAddress: orderData.shippingAddress.address,
        specialRequirements: orderData.shippingAddress.notes,
      },
      items: orderItems,
      totalAmount: orderData.totalAmount,
      status: 'pending',
      orderDate: new Date(),
      paymentMethod: 'bill_confirm',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockOrders.unshift(newOrder);
    return newOrder;
  },

  async getAll(): Promise<Order[]> {
    await simulateDelay(400);
    return [...mockOrders].sort((a, b) => 
      b.orderDate.getTime() - a.orderDate.getTime()
    );
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    await simulateDelay(400);
    return mockOrders
      .filter(order => order.customerId === customerId)
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  },

  async getById(orderId: string): Promise<Order | null> {
    await simulateDelay(200);
    return mockOrders.find(o => o.id === orderId) || null;
  },

  async updateStatus(orderId: string, status: Order['status']): Promise<void> {
    await simulateDelay(300);
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    
    const now = new Date();
    order.status = status;
    order.updatedAt = now;
    
    // 更新状态时间戳
    switch (status) {
      case 'confirmed':
        order.confirmedAt = now;
        break;
      case 'production':
        order.productionStartedAt = now;
        break;
      case 'completed':
        order.completedAt = now;
        break;
    }
  },

  async setDeliveryDate(orderId: string, date: Date): Promise<void> {
    await simulateDelay(300);
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    
    order.deliveryDate = date;
    order.updatedAt = new Date();
  },

  async addProductionNotes(orderId: string, notes: string): Promise<void> {
    await simulateDelay(300);
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    
    order.productionNotes = notes;
    order.updatedAt = new Date();
  }
};

// 认证服务
export const mockAuthService = {
  async login(credentials: LoginCredentials): Promise<User> {
    await simulateDelay(800);
    
    const user = mockUsers.find(u => 
      (u.username === credentials.username || u.email === credentials.username) &&
      u.password === credentials.password
    );
    
    if (!user || !user.isActive) {
      throw new Error('用户名或密码错误');
    }
    
    // 更新最后登录时间
    user.lastLoginAt = new Date();
    
    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async register(userData: RegisterData): Promise<User> {
    await simulateDelay(1000);
    
    // 检查用户名和邮箱是否已存在
    const existingUser = mockUsers.find(u => 
      u.username === userData.username || u.email === userData.email
    );
    
    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }
    
    const newUser: User = {
      id: generateId(),
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: 'customer',
      profile: {
        name: userData.name,
        company: userData.company,
        phone: userData.contact
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockUsers.push(newUser);
    
    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await simulateDelay(500);
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    
    const existingUser = mockUsers[userIndex];
    if (!existingUser) throw new Error('User not found');
    
    mockUsers[userIndex] = { 
      ...existingUser, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    // 返回用户信息（不包含密码）
    const updatedUser = mockUsers[userIndex]!;
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },

  async validateToken(userId: string): Promise<boolean> {
    await simulateDelay(200);
    return mockUsers.some(u => u.id === userId && u.isActive);
  },

  async getAllCustomers(): Promise<User[]> {
    await simulateDelay(400);
    return mockUsers
      .filter(u => u.role === 'customer' && u.isActive)
      .map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  }
}; 