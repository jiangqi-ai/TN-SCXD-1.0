// Vercel兼容性服务
// 使用zustand存储数据库配置

import { useDatabaseStore } from '@/store/useDatabaseStore'

export const isVercelEnvironment = () => {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
}

export const isDatabaseAvailable = () => {
  // 从store中获取配置
  const { isConfigured, databaseUrl } = useDatabaseStore.getState()
  
  // 检查是否配置了数据库且连接字符串有效
  if (!isConfigured || !databaseUrl) {
    return false
  }
  
  // 简单验证连接字符串格式
  try {
    const isValidPostgreSQL = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
    const isValidSQLite = databaseUrl.startsWith('file:')
    return isValidPostgreSQL || isValidSQLite
  } catch {
    return false
  }
}

export const getDatabaseConfig = () => {
  const { databaseUrl, directUrl } = useDatabaseStore.getState()
  return {
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl
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