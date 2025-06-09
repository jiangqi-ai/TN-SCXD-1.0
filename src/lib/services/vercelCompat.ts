// Vercel兼容性服务
// 在Vercel环境下使用localStorage，本地开发使用数据库

export const isVercelEnvironment = () => {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
}

export const isDatabaseAvailable = () => {
  // 检查是否有数据库 URL 配置
  return !!process.env.DATABASE_URL
}

export const getStorageInfo = () => {
  const vercel = isVercelEnvironment()
  const database = isDatabaseAvailable()
  
  return {
    environment: vercel ? 'vercel' : 'local',
    useDatabase: database,
    useLocalStorage: !database,
    reason: database 
      ? vercel 
        ? '运行在Vercel环境，使用PostgreSQL数据库' 
        : '本地环境，使用数据库'
      : '数据库不可用，回退到localStorage'
  }
} 