import { generateId } from "@/lib/utils/helpers";
import type { CustomerType, Product } from '@/types';

// 空的初始产品数据 - 所有产品通过管理员上传
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
    
    // 确保在客户端执行
    if (typeof window === 'undefined') {
      return initialProducts;
    }
    
    const products = storage.getProducts();
    let filteredProducts = products.filter(p => p.isActive);
    
    // 优化权限逻辑：
    // 1. 如果没有客户类型（未登录或未分类），显示所有产品
    // 2. 如果有客户类型，显示匹配的产品 + 没有指定目标客户的产品（通用产品）
    // 3. 如果客户类型是"未分类"，显示所有产品
    if (customerType && customerType !== '未分类') {
      filteredProducts = filteredProducts.filter(p => {
        // 显示以下产品：
        // 1. 目标客户包含当前客户类型的产品
        // 2. 没有设置目标客户的产品（通用产品）
        return p.targetCustomers.includes(customerType) || p.targetCustomers.length === 0;
      });
    }
    // 如果是未分类客户或没有客户类型，显示所有激活的产品
    
    return filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllForAdmin(): Promise<Product[]> {
    await simulateDelay(100); // 减少延迟到100ms提升速度
    
    // 确保在客户端执行
    if (typeof window === 'undefined') {
      return initialProducts;
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
    
    return products[index]!;
  },

  async delete(id: string): Promise<void> {
    await simulateDelay(100); // 减少延迟到100ms提升速度
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    products.splice(index, 1);
    storage.setProducts(products);
  },

  async uploadFromExcel(newProducts: Product[]): Promise<void> {
    await simulateDelay(500); // 减少延迟到500ms，批量上传保持适中延迟
    const products = storage.getProducts();
    products.unshift(...newProducts);
    storage.setProducts(products);
  }
}; 