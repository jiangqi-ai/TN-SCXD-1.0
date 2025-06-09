import { databaseProductService } from './databaseService'
import { safeProductService } from './databaseServiceSafe'
import { isDatabaseAvailable, getStorageInfo } from './vercelCompat'
import type { CustomerType, Product, ProductCategory, ProductSubCategory } from '@/types'

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
        const result = await databaseProductService.getProducts({})
        // 转换数据库产品格式为应用产品格式
        return result.products.map(dbProduct => ({
          id: dbProduct.id,
          productCode: dbProduct.name,
          image: dbProduct.images,
          availableDimensions: dbProduct.size ? [dbProduct.size] : [],
          weight: dbProduct.weight || 0,
          pieceCount: 1,
          minimumOrderQty: dbProduct.minOrderQty || 1,
          availableColors: dbProduct.colors ? dbProduct.colors.split(',') : [],
          unitPrice: dbProduct.price,
          remarks: dbProduct.description,
          features: dbProduct.features ? dbProduct.features.split(',') : [],
          applications: dbProduct.specifications,
          isActive: dbProduct.isActive || false,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
          category: dbProduct.category as ProductCategory,
          subCategory: dbProduct.category as ProductSubCategory,
          targetCustomers: ['未分类'],
          discountable: true,
          maxDiscount: 100
        }))
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
        const result = await databaseProductService.getProducts({})
        // 转换数据库产品格式为应用产品格式
        return result.products.map(dbProduct => ({
          id: dbProduct.id,
          productCode: dbProduct.name,
          image: dbProduct.images,
          availableDimensions: dbProduct.size ? [dbProduct.size] : [],
          weight: dbProduct.weight || 0,
          pieceCount: 1,
          minimumOrderQty: dbProduct.minOrderQty || 1,
          availableColors: dbProduct.colors ? dbProduct.colors.split(',') : [],
          unitPrice: dbProduct.price,
          remarks: dbProduct.description,
          features: dbProduct.features ? dbProduct.features.split(',') : [],
          applications: dbProduct.specifications,
          isActive: dbProduct.isActive || false,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
          category: dbProduct.category as ProductCategory,
          subCategory: dbProduct.category as ProductSubCategory,
          targetCustomers: ['未分类'],
          discountable: true,
          maxDiscount: 100
        }))
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
        const dbProduct = await databaseProductService.getProductById(id)
        if (!dbProduct) return null
        
        // 转换数据库产品格式为应用产品格式
        return {
          id: dbProduct.id,
          productCode: dbProduct.name,
          image: dbProduct.images,
          availableDimensions: dbProduct.size ? [dbProduct.size] : [],
          weight: dbProduct.weight || 0,
          pieceCount: 1,
          minimumOrderQty: dbProduct.minOrderQty || 1,
          availableColors: dbProduct.colors ? dbProduct.colors.split(',') : [],
          unitPrice: dbProduct.price,
          remarks: dbProduct.description,
          features: dbProduct.features ? dbProduct.features.split(',') : [],
          applications: dbProduct.specifications,
          isActive: dbProduct.isActive || false,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
          category: dbProduct.category as ProductCategory,
          subCategory: dbProduct.category as ProductSubCategory,
          targetCustomers: ['未分类'],
          discountable: true,
          maxDiscount: 100
        }
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
        // 转换应用产品格式为数据库产品格式
        const dbProductData = {
          name: productData.productCode,
          category: productData.category,
          brand: '',
          model: '',
          description: productData.remarks || '',
          specifications: productData.applications || '',
          images: productData.image,
          price: productData.unitPrice,
          stock: 0,
          weight: productData.weight,
          size: productData.availableDimensions[0] || '',
          colors: productData.availableColors.join(','),
          features: productData.features?.join(',') || '',
          certifications: '',
          isActive: productData.isActive,
          isFeatured: false,
          minOrderQty: productData.minimumOrderQty
        }
        
        const dbProduct = await databaseProductService.createProduct(dbProductData)
        
        // 转换回应用产品格式
        const result: Product = {
          id: dbProduct.id,
          productCode: dbProduct.name,
          image: dbProduct.images,
          availableDimensions: dbProduct.size ? [dbProduct.size] : [],
          weight: dbProduct.weight || 0,
          pieceCount: 1,
          minimumOrderQty: dbProduct.minOrderQty || 1,
          availableColors: dbProduct.colors ? dbProduct.colors.split(',') : [],
          unitPrice: dbProduct.price,
          remarks: dbProduct.description,
          features: dbProduct.features ? dbProduct.features.split(',') : [],
          applications: dbProduct.specifications,
          isActive: dbProduct.isActive || false,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
          category: dbProduct.category as ProductCategory,
          subCategory: dbProduct.category as ProductSubCategory,
          targetCustomers: ['未分类'],
          discountable: true,
          maxDiscount: 100
        }
        
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
        // 转换应用产品格式为数据库产品格式
        const dbUpdates: any = {}
        if (updates.productCode !== undefined) dbUpdates.name = updates.productCode
        if (updates.category !== undefined) dbUpdates.category = updates.category
        if (updates.remarks !== undefined) dbUpdates.description = updates.remarks
        if (updates.applications !== undefined) dbUpdates.specifications = updates.applications
        if (updates.image !== undefined) dbUpdates.images = updates.image
        if (updates.unitPrice !== undefined) dbUpdates.price = updates.unitPrice
        if (updates.weight !== undefined) dbUpdates.weight = updates.weight
        if (updates.availableDimensions !== undefined) dbUpdates.size = updates.availableDimensions[0] || ''
        if (updates.availableColors !== undefined) dbUpdates.colors = updates.availableColors.join(',')
        if (updates.features !== undefined) dbUpdates.features = updates.features.join(',')
        if (updates.isActive !== undefined) dbUpdates.isActive = updates.isActive
        if (updates.minimumOrderQty !== undefined) dbUpdates.minOrderQty = updates.minimumOrderQty
        
        const dbProduct = await databaseProductService.updateProduct(id, dbUpdates)
        
        // 转换回应用产品格式
        const result: Product = {
          id: dbProduct.id,
          productCode: dbProduct.name,
          image: dbProduct.images,
          availableDimensions: dbProduct.size ? [dbProduct.size] : [],
          weight: dbProduct.weight || 0,
          pieceCount: 1,
          minimumOrderQty: dbProduct.minOrderQty || 1,
          availableColors: dbProduct.colors ? dbProduct.colors.split(',') : [],
          unitPrice: dbProduct.price,
          remarks: dbProduct.description,
          features: dbProduct.features ? dbProduct.features.split(',') : [],
          applications: dbProduct.specifications,
          isActive: dbProduct.isActive || false,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
          category: dbProduct.category as ProductCategory,
          subCategory: dbProduct.category as ProductSubCategory,
          targetCustomers: ['未分类'],
          discountable: true,
          maxDiscount: 100
        }
        
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
        await databaseProductService.deleteProduct(id)
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
        // 转换应用产品格式为数据库产品格式
        const dbProducts = newProducts.map(product => ({
          name: product.productCode,
          category: product.category,
          brand: '',
          model: '',
          description: product.remarks || '',
          specifications: product.applications || '',
          images: product.image,
          price: product.unitPrice,
          stock: 0,
          weight: product.weight,
          size: product.availableDimensions[0] || '',
          colors: product.availableColors.join(','),
          features: product.features?.join(',') || '',
          certifications: '',
          isActive: product.isActive,
          isFeatured: false,
          minOrderQty: product.minimumOrderQty
        }))
        
        await databaseProductService.uploadFromExcel(dbProducts)
        
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