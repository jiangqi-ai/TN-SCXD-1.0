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
let mockProducts: Product[] = [
  {
    id: '1',
    productCode: 'CW-001-30x30',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    availableDimensions: ['30cm x 30cm x 5cm', '25cm x 25cm x 4cm'],
    weight: 2.5,
    pieceCount: 4,
    minimumOrderQty: 10,
    availableColors: ['红色', '蓝色', '绿色', '黄色'],
    unitPrice: 45.00,
    remarks: '适合室内攀岩墙使用',
    features: ['高强度材料，安全可靠', '精密加工，质量上乘', '多种规格可选，满足不同需求', '专业设计，操作简便', '严格质检，品质保证'],
    applications: '适用于室内攀岩馆、户外天然岩壁、人工攀岩墙等各种攀岩场景。无论是初学者还是专业攀岩者，都能找到适合的规格和配置。',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    productCode: 'CW-002-25x25',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    availableDimensions: ['25cm x 25cm x 4cm', '20cm x 15cm x 10cm'],
    weight: 1.8,
    pieceCount: 6,
    minimumOrderQty: 15,
    availableColors: ['蓝色', '绿色', '黑色'],
    unitPrice: 38.00,
    remarks: '适合初学者训练使用',
    features: ['轻量化设计', '易于安装', '表面防滑处理', '环保材质'],
    applications: '主要用于初学者攀岩训练，适合攀岩馆的儿童区域和初级线路设置。',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    productCode: 'CW-003-35x35',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    availableDimensions: ['35cm x 35cm x 6cm', '40cm x 30cm x 20cm'],
    weight: 3.2,
    pieceCount: 2,
    minimumOrderQty: 8,
    availableColors: ['绿色', '橙色', '紫色'],
    unitPrice: 55.00,
    remarks: '专业级攀岩点，适合高难度线路',
    features: ['超强握力', '耐磨损设计', '专业认证', '长期耐用'],
    applications: '专为高难度攀岩线路设计，适用于竞赛级攀岩墙和专业训练场所。',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '4',
    productCode: 'CW-004-50x40',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    availableDimensions: ['50cm x 40cm x 30cm'],
    weight: 5.0,
    pieceCount: 1,
    minimumOrderQty: 5,
    availableColors: ['红色', '黄色'],
    unitPrice: 88.00,
    remarks: '大型攀岩点，创造挑战性路线',
    features: ['大尺寸设计', '多握点选择', '稳固安装', '视觉突出'],
    applications: '用于创建具有挑战性的攀岩路线，适合高级攀岩者和竞赛使用。',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '5',
    productCode: 'CW-005-20x15',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    availableDimensions: ['20cm x 15cm x 10cm'],
    weight: 1.2,
    pieceCount: 8,
    minimumOrderQty: 20,
    availableColors: ['白色', '灰色', '黑色', '红色'],
    unitPrice: 28.00,
    remarks: '小型训练点，适合技巧练习',
    features: ['小巧便携', '易于抓握', '适合训练', '多颜色可选'],
    applications: '主要用于技巧训练和热身练习，适合各个水平的攀岩者进行基础动作练习。',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

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
let mockOrders: Order[] = [];

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
  },

  async delete(orderId: string): Promise<void> {
    await simulateDelay(300);
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('Order not found');
    
    mockOrders.splice(orderIndex, 1);
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