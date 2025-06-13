#!/usr/bin/env node

import { createInterface } from 'readline'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupDatabase() {
  console.log('🗄️  PostgreSQL 数据库配置向导\n')
  console.log('请选择数据库类型：')
  console.log('1. Neon Database (免费云数据库，推荐)')
  console.log('2. Supabase (免费云数据库)')
  console.log('3. 本地 PostgreSQL')
  console.log('4. 其他 PostgreSQL 服务\n')
  
  const choice = await question('请输入选项 (1-4): ')
  
  let databaseUrl = ''
  let directUrl = ''
  
  switch (choice) {
    case '1':
      console.log('\n📖 Neon Database 设置:')
      console.log('1. 访问 https://neon.tech 注册账户')
      console.log('2. 创建新项目')
      console.log('3. 复制 Connection String\n')
      databaseUrl = await question('请粘贴 Neon 连接字符串: ')
      directUrl = databaseUrl
      break
      
    case '2':
      console.log('\n📖 Supabase 设置:')
      console.log('1. 访问 https://supabase.com 注册账户')
      console.log('2. 创建新项目')
      console.log('3. 在 Settings > Database 中找到连接字符串\n')
      databaseUrl = await question('请粘贴 Supabase 连接字符串: ')
      directUrl = databaseUrl
      break
      
    case '3':
      console.log('\n💻 本地 PostgreSQL 设置:')
      const host = await question('主机地址 (默认: localhost): ') || 'localhost'
      const port = await question('端口 (默认: 5432): ') || '5432'
      const database = await question('数据库名称 (默认: climbing_gear_system): ') || 'climbing_gear_system'
      const username = await question('用户名: ')
      const password = await question('密码: ')
      
      databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`
      directUrl = databaseUrl
      break
      
    case '4':
      console.log('\n🔗 自定义 PostgreSQL:')
      databaseUrl = await question('请输入完整的连接字符串: ')
      directUrl = await question('直接连接字符串 (留空使用主连接): ') || databaseUrl
      break
      
    default:
      console.log('❌ 无效选项')
      rl.close()
      return
  }
  
  if (!databaseUrl) {
    console.log('❌ 连接字符串不能为空')
    rl.close()
    return
  }
  
  // 验证连接字符串格式
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.log('❌ 连接字符串格式不正确，应该以 postgresql:// 或 postgres:// 开头')
    rl.close()
    return
  }
  
  // 创建 .env 文件
  const envContent = `# 数据库配置
DATABASE_URL="${databaseUrl}"
DIRECT_URL="${directUrl}"

# 开发配置
NODE_ENV="development"
`
  
  const envPath = '.env'
  
  try {
    writeFileSync(envPath, envContent)
    console.log('\n✅ 数据库配置已保存到 .env 文件')
    
    console.log('\n🚀 下一步操作:')
    console.log('1. 运行 npm run db:push 初始化数据库结构')
    console.log('2. 运行 npm run dev 启动应用')
    console.log('3. 访问 http://localhost:3000/admin 测试数据库连接')
    
  } catch (error) {
    console.error('❌ 保存配置文件失败:', error.message)
  }
  
  rl.close()
}

setupDatabase().catch(console.error) 