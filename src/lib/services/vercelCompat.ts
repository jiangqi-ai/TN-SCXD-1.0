// Vercel兼容性服务
// 使用zustand存储数据库配置

import { useDatabaseStore } from '@/store/useDatabaseStore'

export const isVercelEnvironment = () => {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
}

export const isDatabaseAvailable = () => {
  // 服务端安全检查
  if (typeof window === 'undefined') {
    // 服务端：优先检查环境变量
    const envUrl = process.env.DATABASE_URL
    if (envUrl && (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://'))) {
      return true
    }
  }
  
  try {
    // 从store中获取配置
    const { isConfigured, databaseUrl } = useDatabaseStore.getState()
    
    // 检查是否配置了数据库且连接字符串有效
    if (!isConfigured || !databaseUrl) {
      return false
    }
    
    // 简单验证连接字符串格式
    const isValidPostgreSQL = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
    const isValidSQLite = databaseUrl.startsWith('file:')
    return isValidPostgreSQL || isValidSQLite
  } catch (error) {
    console.warn('Store access error in isDatabaseAvailable:', error)
    return false
  }
}

export const getDatabaseConfig = () => {
  try {
    const { databaseUrl, directUrl } = useDatabaseStore.getState()
    
    // 动态设置环境变量，确保Prisma可以访问
    if (databaseUrl && typeof process !== 'undefined' && process.env) {
      // 验证URL格式
      try {
        new URL(databaseUrl) // 验证URL格式
        process.env.DATABASE_URL = databaseUrl
        process.env.DIRECT_URL = directUrl || databaseUrl
      } catch (urlError) {
        console.error('Invalid database URL format:', urlError)
        // 清理无效的环境变量
        delete process.env.DATABASE_URL
        delete process.env.DIRECT_URL
      }
    }
    
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL
    }
  } catch (error) {
    console.warn('Store access error in getDatabaseConfig:', error)
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL
    }
  }
}

export const getStorageInfo = () => {
  const vercel = isVercelEnvironment()
  const database = isDatabaseAvailable()
  
  return {
    environment: vercel ? 'vercel' : 'local',
    useDatabase: database,
    useLocalStorage: !database,
    reason: database 
      ? '数据库已配置' 
      : '数据库未配置，请在管理员设置中配置数据库连接'
  }
}

// 初始化环境变量（在模块加载时执行）
export const initializeEnvironment = () => {
  const config = getDatabaseConfig()
  return config
} 