import type { Product, CustomerType } from '@/types';
import { generateId } from "@/lib/utils/helpers";
import { cloudSyncService } from './cloudSyncService';

// 初始产品数据
const initialProducts: Product[] = [
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
    updatedAt: new Date('2024-01-01'),
    category: '岩点',
    subCategory: '玻璃钢境面',
    targetCustomers: ['OEM客户', '品牌客户'],
    discountable: true,
    maxDiscount: 15
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
    updatedAt: new Date('2024-01-01'),
    category: '攀岩板材',
    subCategory: '常规攀岩板',
    targetCustomers: ['工程客户'],
    discountable: true,
    maxDiscount: 12
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
    updatedAt: new Date('2024-01-01'),
    category: '岩点',
    subCategory: 'PU点',
    targetCustomers: ['品牌客户', '工程客户'],
    discountable: false,
    maxDiscount: 0
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
    updatedAt: new Date('2024-01-01'),
    category: '五金配件',
    subCategory: '固定件',
    targetCustomers: ['OEM客户'],
    discountable: true,
    maxDiscount: 8
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
    updatedAt: new Date('2024-01-01'),
    category: '攀岩板材',
    subCategory: '高密度攀岩板',
    targetCustomers: ['OEM客户', '品牌客户', '工程客户'],
    discountable: true,
    maxDiscount: 20
  }
];

// 存储键名
const STORAGE_KEY = 'tn-scxd-products';

// 存储工具
const storage = {
  getProducts: (): Product[] => {
    if (typeof window === 'undefined') return initialProducts;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return initialProducts;
      
      const products = JSON.parse(stored, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
      return products;
    } catch {
      return initialProducts;
    }
  },

  setProducts: (products: Product[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }
};

// 延迟模拟
const simulateDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 产品服务
export const productService = {
  async getAll(customerType?: CustomerType): Promise<Product[]> {
    await simulateDelay(500);
    
    // 尝试从云端同步最新数据
    if (cloudSyncService.isCloudSyncEnabled()) {
      try {
        const cloudProducts = await cloudSyncService.fetchFromCloud();
        storage.setProducts(cloudProducts);
      } catch (error) {
        console.log('⚠️ 云端同步失败，使用本地数据:', error instanceof Error ? error.message : '未知错误');
      }
    }
    
    const products = storage.getProducts();
    let filteredProducts = products.filter(p => p.isActive);
    
    if (customerType) {
      filteredProducts = filteredProducts.filter(p => 
        p.targetCustomers.includes(customerType)
      );
    }
    
    return filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllForAdmin(): Promise<Product[]> {
    await simulateDelay(500);
    const products = storage.getProducts();
    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<Product | null> {
    await simulateDelay(200);
    const products = storage.getProducts();
    return products.find(p => p.id === id) || null;
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    await simulateDelay(300);
    const products = storage.getProducts();
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    products.push(newProduct);
    storage.setProducts(products);
    
    // 同步到云端
    await cloudSyncService.syncToCloud(products);
    
    return newProduct;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    await simulateDelay(300);
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    const existingProduct = products[index];
    if (!existingProduct) throw new Error('Product not found');
    
    products[index] = { 
      ...existingProduct, 
      ...updates, 
      updatedAt: new Date() 
    };
    storage.setProducts(products);
    
    // 同步到云端
    await cloudSyncService.syncToCloud(products);
    
    return products[index]!;
  },

  async delete(id: string): Promise<void> {
    await simulateDelay(300);
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    products.splice(index, 1);
    storage.setProducts(products);
    
    // 同步到云端
    await cloudSyncService.syncToCloud(products);
  },

  async uploadFromExcel(newProducts: Product[]): Promise<void> {
    await simulateDelay(1000);
    const products = storage.getProducts();
    products.unshift(...newProducts);
    storage.setProducts(products);
    
    // 同步到云端
    await cloudSyncService.syncToCloud(products);
  }
}; 