import { generateId } from "@/lib/utils/helpers";
import type { CustomerType, Product } from '@/types';
import { cloudSyncService } from './cloudSyncService';

// 空的初始产品数据 - 所有产品通过管理员上传和云端同步
const initialProducts: Product[] = [];

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

// 减少延迟模拟以提升响应速度
const simulateDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 产品服务
export const productService = {
  async getAll(customerType?: CustomerType): Promise<Product[]> {
    await simulateDelay(100); // 减少延迟到100ms提升速度
    
    // 优先从云端同步最新数据
    if (cloudSyncService.isCloudSyncEnabled()) {
      try {
        const cloudProducts = await cloudSyncService.fetchFromCloud();
        storage.setProducts(cloudProducts);
        console.log('✅ 用户获取到云端最新产品数据');
      } catch (error) {
        console.log('⚠️ 用户云端同步失败，使用本地数据:', error instanceof Error ? error.message : '未知错误');
      }
    } else {
      console.log('💡 云端同步未启用，如无产品数据请联系管理员配置');
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
    await simulateDelay(100); // 减少延迟到100ms提升速度
    
    // 管理员也需要从云端同步最新数据
    if (cloudSyncService.isCloudSyncEnabled()) {
      try {
        const cloudProducts = await cloudSyncService.fetchFromCloud();
        storage.setProducts(cloudProducts);
        console.log('✅ 管理员获取到云端最新产品数据');
      } catch (error) {
        console.log('⚠️ 管理员云端同步失败，使用本地数据:', error instanceof Error ? error.message : '未知错误');
      }
    }
    
    const products = storage.getProducts();
    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<Product | null> {
    await simulateDelay(50); // 减少延迟到50ms提升速度
    const products = storage.getProducts();
    return products.find(p => p.id === id) || null;
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    await simulateDelay(100); // 减少延迟到100ms提升速度
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
    await simulateDelay(100); // 减少延迟到100ms提升速度
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
    await simulateDelay(100); // 减少延迟到100ms提升速度
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    products.splice(index, 1);
    storage.setProducts(products);
    
    // 同步到云端
    await cloudSyncService.syncToCloud(products);
  },

  async uploadFromExcel(newProducts: Product[]): Promise<void> {
    await simulateDelay(500); // 减少延迟到500ms，批量上传保持适中延迟
    const products = storage.getProducts();
    products.unshift(...newProducts);
    storage.setProducts(products);
    
    // 同步到云端
    await cloudSyncService.syncToCloud(products);
  }
}; 