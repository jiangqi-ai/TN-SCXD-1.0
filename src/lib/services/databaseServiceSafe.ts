// 安全的数据库服务 - 用于Vercel部署
// 在Vercel环境下自动回退到localStorage

import { isVercelEnvironment } from './vercelCompat'
import { productService as localProductService } from './productService'
import type { CustomerType, Product } from '@/types'

// 默认使用本地产品服务，避免数据库依赖
export const safeProductService = {
  async getAll(customerType?: CustomerType): Promise<Product[]> {
    return await localProductService.getAll(customerType)
  },

  async getAllForAdmin(): Promise<Product[]> {
    return await localProductService.getAllForAdmin()
  },

  async getById(id: string): Promise<Product | null> {
    return await localProductService.getById(id)
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return await localProductService.create(productData)
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    return await localProductService.update(id, updates)
  },

  async delete(id: string): Promise<void> {
    return await localProductService.delete(id)
  },

  async uploadFromExcel(newProducts: Product[]): Promise<void> {
    return await localProductService.uploadFromExcel(newProducts)
  }
} 