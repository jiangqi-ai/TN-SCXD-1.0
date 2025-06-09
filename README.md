# 攀岩墙练手系统 (Climbing Wall Training System)

一个现代化的攀岩训练管理系统，帮助攀岩者记录和管理训练数据。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 数据库配置

本系统使用 **PostgreSQL** 数据库来实现跨设备数据同步。

#### 选项一：使用 Vercel Postgres（推荐）
1. 在 [Vercel Dashboard](https://vercel.com/dashboard) 中进入你的项目
2. 点击 **Storage** > **Connect Database** > **Postgres** > **Neon**
3. 按提示创建数据库

#### 选项二：使用免费的 Neon 数据库
1. 访问 [console.neon.tech](https://console.neon.tech) 创建免费账户
2. 创建新项目，获取连接字符串

### 3. 环境变量配置
```bash
# 复制环境变量模板
cp env.local.example .env.local

# 编辑 .env.local，替换为你的数据库连接字符串
# DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### 4. 初始化数据库
```bash
# 生成 Prisma Client
npm run db:generate

# 创建数据库表
npm run db:push

# 初始化默认数据
npm run db:init
```

### 5. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 📖 详细文档

- [Vercel Postgres 配置指南](./VERCEL_POSTGRES_SETUP.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)
- [本地开发环境配置](./LOCAL_DEVELOPMENT_SETUP.md)

## ✨ 主要功能

- 🧗‍♂️ 练手记录管理
- 📊 训练数据统计
- 🔒 用户认证系统
- 📱 响应式设计
- 🌐 跨设备数据同步

## 🛠️ 技术栈

- **前端**: Next.js 15, React, TypeScript
- **数据库**: PostgreSQL (Neon)
- **ORM**: Prisma
- **样式**: Tailwind CSS, Shadcn/ui
- **状态管理**: Zustand
- **部署**: Vercel

## 📋 管理后台

访问 `/admin` 进入管理后台，默认密码在 `.env.local` 中配置。

## 🐛 故障排除

如果遇到数据库连接问题：

1. 检查 `.env.local` 中的连接字符串格式
2. 确保连接字符串以 `postgresql://` 开头
3. 确认网络可以访问数据库服务器
4. 查看管理后台的"系统设置"页面了解数据库状态

## �� 许可证

MIT License
