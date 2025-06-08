import { generateId, generateOrderId } from "@/lib/utils/helpers";
import type { 
  CreateOrderRequest, 
  LoginCredentials, 
  Order, 
  OrderItem,
  RegisterData,
  User 
} from '@/types';
import { productService } from './productService';
import { securityService } from './securityService';

// 从环境变量获取默认密码
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
const DEFAULT_CUSTOMER_PASSWORD = process.env.DEFAULT_CUSTOMER_PASSWORD || 'customer123';

// 存储键名
const STORAGE_KEYS = {
  USERS: 'tn-scxd-users', 
  ORDERS: 'tn-scxd-orders',
  // 数据版本控制
  DATA_VERSION: 'tn-scxd-data-version',
  LAST_SYNC: 'tn-scxd-last-sync'
};

// 数据版本控制
const DATA_VERSION = '1.0.0';
const SYNC_INTERVAL = 5 * 60 * 1000; // 5分钟检查一次

// 初始用户数据
const initialUsers: User[] = [
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

// 存储工具函数
const storage = {
  // 初始化标志
  _initialized: false,

  // 检查数据版本和同步状态
  checkDataVersion: () => {
    if (typeof window === 'undefined') return false;
    
    const storedVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const now = Date.now();
    
    // 如果版本不匹配或超过同步间隔，需要重新初始化
    if (storedVersion !== DATA_VERSION || 
        !lastSync || 
        (now - Number.parseInt(lastSync)) > SYNC_INTERVAL) {
      return false;
    }
    return true;
  },

  // 强制重置数据（解决数据不同步问题）
  forceReset: () => {
    if (typeof window === 'undefined') return;
    
    console.log('🔄 正在重新同步数据...');
    
    // 清除旧数据 - 不清除产品数据，产品数据通过云端同步
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    
    // 重新初始化
    storage._initialized = false;
    storage.ensureInitialized();
    
    console.log('✅ 数据同步完成');
  },

  // 更新同步时间戳
  updateSyncTimestamp: () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.DATA_VERSION, DATA_VERSION);
  },

  // 确保初始化
  ensureInitialized: () => {
    if (typeof window === 'undefined' || storage._initialized) return;
    
    // 检查数据版本，如果不匹配则强制重置
    if (!storage.checkDataVersion()) {
      console.log('🔄 检测到数据版本不匹配，正在重新同步数据...');
      
      // 清除旧数据 - 不清除产品数据，产品数据通过云端同步
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      
      // 重新设置初始数据
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      
      // 更新版本信息
      storage.updateSyncTimestamp();
      
      console.log('✅ 数据同步完成');
    } else {
      // 正常初始化逻辑
      // 如果localStorage中没有用户数据，使用初始数据
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
      }
      
      // 如果localStorage中没有订单数据，初始化为空数组
      if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      }
    }
    
    storage._initialized = true;
  },

  // 安全的JSON解析
  safeJSONParse: <T>(str: string | null, fallback: T): T => {
    if (!str) return fallback;
    try {
      const parsed = JSON.parse(str);
      // 转换日期字符串为Date对象
      return JSON.parse(str, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    } catch {
      return fallback;
    }
  },

  // 获取用户数据
  getUsers: (): User[] => {
    if (typeof window === 'undefined') return initialUsers;
    storage.ensureInitialized();
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    return storage.safeJSONParse(stored, initialUsers);
  },

  // 保存用户数据
  setUsers: (users: User[]): void => {
    if (typeof window === 'undefined') return;
    storage.ensureInitialized();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // 获取订单数据
  getOrders: (): Order[] => {
    if (typeof window === 'undefined') return [];
    storage.ensureInitialized();
    const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return storage.safeJSONParse(stored, []);
  },

  // 保存订单数据
  setOrders: (orders: Order[]): void => {
    if (typeof window === 'undefined') return;
    storage.ensureInitialized();
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }
};

// 模拟延迟函数
const simulateDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 导出产品服务 - 为了向后兼容
export const mockProductService = productService;

// 订单服务
export const mockOrderService = {
  async create(orderData: CreateOrderRequest): Promise<Order> {
    await simulateDelay(200); // 减少订单创建延迟
    
    const orders = storage.getOrders();
    const products = await productService.getAllForAdmin();
    const orderNumber = generateOrderId();
    
    // 获取商品详细信息
    const orderItems: OrderItem[] = [];
    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const subtotal = item.unitPrice * item.quantity;
        const discount = item.discount || 0;
        const originalPrice = item.unitPrice;
        const discountedPrice = originalPrice * (1 - discount / 100);
        
        orderItems.push({
          productId: item.productId,
          productCode: product.productCode,
          productName: product.productCode,
          image: product.image,
          selectedDimension: product.availableDimensions[0] || '',
          weight: product.weight,
          pieceCount: product.pieceCount,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: subtotal,
          discount: discount,
          originalPrice: originalPrice,
          discountedPrice: discountedPrice,
          discountable: product.discountable,
          maxDiscount: product.maxDiscount,
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
      updatedAt: new Date(),
      originalAmount: orderData.originalAmount || orderData.totalAmount,
      discountAmount: orderData.discountAmount || 0,
    };
    
    orders.unshift(newOrder);
    storage.setOrders(orders);
    return newOrder;
  },

  async getAll(): Promise<Order[]> {
    await simulateDelay(100); // 减少获取所有订单延迟
    const orders = storage.getOrders();
    return [...orders].sort((a, b) => 
      b.orderDate.getTime() - a.orderDate.getTime()
    );
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    await simulateDelay(100); // 减少按客户获取订单延迟
    const orders = storage.getOrders();
    return orders
      .filter(order => order.customerId === customerId)
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  },

  async getById(orderId: string): Promise<Order | null> {
    await simulateDelay(50); // 减少按ID获取订单延迟
    const orders = storage.getOrders();
    return orders.find(o => o.id === orderId) || null;
  },

  async updateStatus(orderId: string, status: Order['status']): Promise<void> {
    await simulateDelay(100); // 减少更新订单状态延迟
    const orders = storage.getOrders();
    const order = orders.find(o => o.id === orderId);
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
    
    storage.setOrders(orders);
  },

  async setDeliveryDate(orderId: string, date: Date): Promise<void> {
    await simulateDelay(100); // 减少设置交货日期延迟
    const orders = storage.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    
    order.deliveryDate = date;
    order.updatedAt = new Date();
    storage.setOrders(orders);
  },

  async addProductionNotes(orderId: string, notes: string): Promise<void> {
    await simulateDelay(100); // 减少添加生产备注延迟
    const orders = storage.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    
    order.productionNotes = notes;
    order.updatedAt = new Date();
    storage.setOrders(orders);
  },

  async delete(orderId: string): Promise<void> {
    await simulateDelay(100); // 减少删除订单延迟
    const orders = storage.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('Order not found');
    
    orders.splice(orderIndex, 1);
    storage.setOrders(orders);
  }
};

// 用户认证服务
export const mockAuthService = {
  async login(credentials: LoginCredentials): Promise<User> {
    // 检查IP是否被阻止
    if (securityService.isIPBlocked()) {
      const remainingTime = securityService.getBlockTimeRemaining();
      throw new Error(`IP已被临时阻止，请在${remainingTime}分钟后重试`);
    }

    await simulateDelay(200); // 减少登录延迟从800ms到200ms
    const users = storage.getUsers();
    const user = users.find(u => 
      (u.username === credentials.username || u.email === credentials.username) && 
      u.password === credentials.password &&
      u.isActive
    );
    
    if (!user) {
      // 记录失败的登录尝试
      securityService.recordLoginAttempt(false);
      throw new Error('用户名或密码错误');
    }

    // 检查用户是否已在其他IP登录
    const sessionCheck = securityService.checkUserSession(user.id);
    if (sessionCheck.hasActiveSession) {
      // 记录失败的登录尝试（重复登录）
      securityService.recordLoginAttempt(false);
      throw new Error('该账户已在其他设备登录，请先退出后重试');
    }

    // 记录成功的登录尝试
    securityService.recordLoginAttempt(true);
    
    // 创建用户会话
    securityService.createUserSession(user.id);

    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async register(userData: RegisterData): Promise<User> {
    // 检查IP是否被阻止
    if (securityService.isIPBlocked()) {
      const remainingTime = securityService.getBlockTimeRemaining();
      throw new Error(`IP已被临时阻止，请在${remainingTime}分钟后重试`);
    }

    await simulateDelay(200); // 减少注册延迟从600ms到200ms
    const users = storage.getUsers();
    
    // 检查用户名是否已存在
    const existingUser = users.find(u => 
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
        company: userData.company || '',
        phone: userData.contact,
        address: ''
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    storage.setUsers(users);

    // 创建用户会话
    securityService.createUserSession(newUser.id);

    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  async logout(userId: string): Promise<void> {
    await simulateDelay(50); // 减少退出延迟到50ms
    // 移除用户会话
    securityService.removeUserSession(userId);
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await simulateDelay(100); // 减少更新用户资料延迟
    const users = storage.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    const existingUser = users[userIndex]!;
    users[userIndex] = {
      ...existingUser,
      ...updates,
      updatedAt: new Date()
    };

    storage.setUsers(users);

    // 更新会话活动时间
    securityService.updateSessionActivity(userId);

    // 返回更新后的用户信息（不包含密码）
    const { password, ...userWithoutPassword } = users[userIndex]!;
    return userWithoutPassword;
  },

  async validateToken(userId: string): Promise<boolean> {
    await simulateDelay(50); // 减少令牌验证延迟到50ms
    const users = storage.getUsers();
    const user = users.find(u => u.id === userId && u.isActive);
    
    if (!user) {
      return false;
    }

    // 检查会话是否有效
    const sessionCheck = securityService.checkUserSession(userId);
    if (sessionCheck.hasActiveSession) {
      // 用户在其他设备登录，当前会话无效
      return false;
    }

    // 更新会话活动时间
    securityService.updateSessionActivity(userId);
    return true;
  },

  async getAllCustomers(): Promise<User[]> {
    await simulateDelay(100); // 减少获取所有客户延迟
    const users = storage.getUsers();
    return users
      .filter(u => u.role === 'customer' && u.isActive)
      .map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  },

  // 管理员功能：强制下线用户
  async forceLogoutUser(adminUserId: string, targetUserId: string): Promise<void> {
    await simulateDelay(100); // 减少强制下线延迟
    const users = storage.getUsers();
    const admin = users.find(u => u.id === adminUserId && u.role === 'admin');
    
    if (!admin) {
      throw new Error('权限不足');
    }

    securityService.forceLogoutUser(targetUserId);
  },

  // 获取安全统计信息（管理员功能）
  async getSecurityStats(adminUserId: string): Promise<{
    blockedIPs: number;
    activeAttempts: number;
    activeSessions: number;
    sessionStats: { totalSessions: number; sessionsByIP: { [ip: string]: number } };
  }> {
    await simulateDelay(50); // 减少安全统计延迟
    const users = storage.getUsers();
    const admin = users.find(u => u.id === adminUserId && u.role === 'admin');
    
    if (!admin) {
      throw new Error('权限不足');
    }

    const securityStats = securityService.getSecurityStats();
    const sessionStats = securityService.getActiveSessionsStats();

    return {
      ...securityStats,
      sessionStats
    };
  },

  // 删除用户（管理员功能）
  async deleteUser(adminUserId: string, targetUserId: string): Promise<void> {
    await simulateDelay(100);
    const users = storage.getUsers();
    const admin = users.find(u => u.id === adminUserId && u.role === 'admin');
    
    if (!admin) {
      throw new Error('权限不足');
    }

    // 不能删除自己
    if (adminUserId === targetUserId) {
      throw new Error('不能删除自己的账户');
    }

    const targetUserIndex = users.findIndex(u => u.id === targetUserId);
    if (targetUserIndex === -1) {
      throw new Error('用户不存在');
    }

    // 强制下线用户
    securityService.forceLogoutUser(targetUserId);
    
    // 删除用户
    users.splice(targetUserIndex, 1);
    storage.setUsers(users);
  },

  // 创建管理员用户（管理员功能）
  async createAdminUser(adminUserId: string, userData: RegisterData): Promise<User> {
    await simulateDelay(200);
    const users = storage.getUsers();
    const admin = users.find(u => u.id === adminUserId && u.role === 'admin');
    
    if (!admin) {
      throw new Error('权限不足');
    }

    // 检查用户名是否已存在
    const existingUser = users.find(u => 
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
      role: 'admin', // 直接设置为管理员角色
      profile: {
        name: userData.name,
        company: userData.company || '',
        phone: userData.contact,
        address: ''
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    storage.setUsers(users);

    // 同步到云端 - 这里不需要同步用户数据到产品云端
    // 用户数据暂时只存储在本地

    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  // 获取所有用户（管理员功能）
  async getAllUsers(adminUserId: string): Promise<User[]> {
    await simulateDelay(100);
    const users = storage.getUsers();
    const admin = users.find(u => u.id === adminUserId && u.role === 'admin');
    
    if (!admin) {
      throw new Error('权限不足');
    }

    return users
      .filter(u => u.isActive)
      .map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  }
};

// 导出数据同步工具（供管理员使用）
export const dataSyncUtils = {
  // 强制重置所有数据到初始状态
  forceResetAllData: () => {
    if (typeof window === 'undefined') {
      console.log('❌ 服务端环境无法操作本地存储');
      return false;
    }
    
    try {
      console.log('🔄 开始强制重置所有数据...');
      storage.forceReset();
      console.log('✅ 数据重置完成');
      return true;
    } catch (error) {
      console.error('❌ 数据重置失败:', error);
      return false;
    }
  },

  // 检查数据同步状态
  checkSyncStatus: () => {
    if (typeof window === 'undefined') {
      return { synchronized: false, reason: '服务端环境' };
    }

    const version = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const now = Date.now();
    
    if (!version || version !== DATA_VERSION) {
      return { 
        synchronized: false, 
        reason: `数据版本不匹配 (当前: ${version || '未知'}, 期望: ${DATA_VERSION})` 
      };
    }
    
    if (!lastSync) {
      return { synchronized: false, reason: '缺少同步时间戳' };
    }
    
    const timeSinceLastSync = now - Number.parseInt(lastSync);
    if (timeSinceLastSync > SYNC_INTERVAL) {
      return { 
        synchronized: false, 
        reason: `超过同步间隔 (${Math.round(timeSinceLastSync / 1000 / 60)}分钟前)` 
      };
    }
    
    return { 
      synchronized: true, 
      lastSyncTime: new Date(Number.parseInt(lastSync)).toLocaleString(),
      version: version
    };
  },

  // 手动触发数据同步
  manualSync: () => {
    if (typeof window === 'undefined') return false;
    
    try {
      console.log('🔄 手动触发数据同步...');
      storage.updateSyncTimestamp();
      console.log('✅ 同步时间戳已更新');
      return true;
    } catch (error) {
      console.error('❌ 手动同步失败:', error);
      return false;
    }
  }
}; 