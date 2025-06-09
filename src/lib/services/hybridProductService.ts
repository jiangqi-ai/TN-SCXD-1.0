import { databaseProductService } from './databaseService'
import { safeProductService } from './databaseServiceSafe'
import { isDatabaseAvailable, getStorageInfo } from './vercelCompat'
import type { CustomerType, Product } from '@/types'

// 动态检测是否使用数据库
const USE_DATABASE = isDatabaseAvailable()

// 在控制台输出存储信息（仅服务器端）
if (typeof window === 'undefined') {
  const info = getStorageInfo()
  console.log(`🔧 存储模式: ${info.environment}, 使用${info.useDatabase ? '数据库' : 'localStorage'} - ${info.reason}`)
}

// 混合产品服务 - 可以在数据库和 localStorage 之间切换
export const productService = {
  async getAll(customerType?: CustomerType): Promise<Product[]> {
    try {
      if (USE_DATABASE) {
        return await databaseProductService.getAll(customerType)
      } else {
        return await safeProductService.getAll(customerType)
      }
    } catch (error) {
      console.error('产品服务错误，回退到本地存储:', error)
      // 如果数据库出错，回退到本地存储
      return await safeProductService.getAll(customerType)
    }
  },

  async getAllForAdmin(): Promise<Product[]> {
    try {
      if (USE_DATABASE) {
        return await databaseProductService.getAllForAdmin()
      } else {
        return await safeProductService.getAllForAdmin()
      }
    } catch (error) {
      console.error('产品服务错误，回退到本地存储:', error)
      return await safeProductService.getAllForAdmin()
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      if (USE_DATABASE) {
        return await databaseProductService.getById(id)
      } else {
        return await safeProductService.getById(id)
      }
    } catch (error) {
      console.error('产品服务错误，回退到本地存储:', error)
      return await safeProductService.getById(id)
    }
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      if (USE_DATABASE) {
        const result = await databaseProductService.create(productData)
        // 同时更新本地存储以保持同步
        await safeProductService.create(productData)
        return result
      } else {
        return await safeProductService.create(productData)
      }
    } catch (error) {
      console.error('产品创建错误:', error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      if (USE_DATABASE) {
        const result = await databaseProductService.update(id, updates)
        // 同时更新本地存储
        try {
          await safeProductService.update(id, updates)
        } catch {
          // 如果本地更新失败，不影响数据库结果
        }
        return result
      } else {
        return await safeProductService.update(id, updates)
      }
    } catch (error) {
      console.error('产品更新错误:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (USE_DATABASE) {
        await databaseProductService.delete(id)
        // 同时删除本地存储
        try {
          await safeProductService.delete(id)
        } catch {
          // 如果本地删除失败，不影响数据库结果
        }
      } else {
        await safeProductService.delete(id)
      }
    } catch (error) {
      console.error('产品删除错误:', error)
      throw error
    }
  },

  async uploadFromExcel(newProducts: Product[]): Promise<void> {
    try {
      if (USE_DATABASE) {
        await databaseProductService.uploadFromExcel(newProducts)
        // 同时更新本地存储
        try {
          await safeProductService.uploadFromExcel(newProducts)
        } catch {
          // 如果本地更新失败，不影响数据库结果
        }
      } else {
        await safeProductService.uploadFromExcel(newProducts)
      }
    } catch (error) {
      console.error('产品批量上传错误:', error)
      throw error
    }
  }
}

// 导出配置检查函数
export const getStorageType = () => USE_DATABASE ? 'database' : 'localStorage'
export const isDatabaseMode = () => USE_DATABASE 