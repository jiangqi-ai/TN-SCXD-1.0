// Vercel兼容性服务
// 使用zustand存储数据库配置

import { useDatabaseStore } from '@/store/useDatabaseStore'

export const isVercelEnvironment = () => {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
}

export const isDatabaseAvailable = () => {
  // 从store中获取配置
  const { isConfigured } = useDatabaseStore.getState()
  return isConfigured
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