// Vercel兼容性服务
// 在Vercel环境下使用localStorage，本地开发使用数据库

export const isVercelEnvironment = () => {
  return process.env.VERCEL === '1' || process.env.DISABLE_DATABASE === 'true'
}

export const isDatabaseAvailable = () => {
  if (isVercelEnvironment()) {
    return false // Vercel环境下禁用数据库
  }
  
  try {
    // 检查数据库文件是否存在
    const fs = require('fs')
    const path = require('path')
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    return fs.existsSync(dbPath)
  } catch (error) {
    return false
  }
}

export const getStorageInfo = () => {
  const vercel = isVercelEnvironment()
  const database = isDatabaseAvailable()
  
  return {
    environment: vercel ? 'vercel' : 'local',
    useDatabase: database && !vercel,
    useLocalStorage: !database || vercel,
    reason: vercel 
      ? '运行在Vercel环境，使用localStorage' 
      : database 
        ? '数据库可用，使用SQLite' 
        : '数据库不可用，回退到localStorage'
  }
} 