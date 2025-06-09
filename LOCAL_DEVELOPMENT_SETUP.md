# 🛠️ 本地开发环境配置

## 问题说明

你遇到的错误是因为当前的 `DATABASE_URL` 不是有效的 PostgreSQL 连接字符串。为了实现本地和 Vercel 的数据同步，我们需要在本地也连接到 PostgreSQL 数据库。

## 🎯 解决方案选择

### 方案一：使用 Vercel Postgres（推荐）

这是最简单的方案，本地和生产环境使用同一个数据库：

#### 1. 首先在 Vercel 上创建数据库
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 **Storage** 标签
4. 点击 **Connect Database**
5. 选择 **Postgres** > **Neon**
6. 按提示创建数据库

#### 2. 获取连接信息
创建完成后，在 Vercel 项目的 **Storage** 标签中，你会看到连接信息。

#### 3. 配置本地环境变量
创建 `.env.local` 文件：

```bash
# 复制 Vercel 项目中的连接信息
DATABASE_URL="postgresql://neondb_owner:npg_VSc0GH5OgpsN@ep-frosty-sun-a4k5as93-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_VSc0GH5OgpsN@ep-frosty-sun-a4k5as93-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

#### 4. 使用 Vercel CLI 自动获取
```bash
# 安装 Vercel CLI
npm i -g vercel@latest

# 登录并链接项目
vercel login
vercel link

# 自动下载环境变量
vercel env pull .env.local
```

### 方案二：使用免费的 PostgreSQL 服务

如果你想要独立的开发数据库：

#### 1. 创建 Neon 账户
- 访问 [neon.tech](https://neon.tech)
- 免费注册账户
- 创建一个新的数据库项目

#### 2. 获取连接字符串
在 Neon 控制台中复制连接字符串，格式类似：
```
postgresql://username:password@host.neon.tech:5432/database?sslmode=require
```

#### 3. 配置本地环境
在 `.env.local` 中设置：
```bash
DATABASE_URL="postgresql://username:password@host.neon.tech:5432/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host.neon.tech:5432/database?sslmode=require"
```

### 方案三：本地 PostgreSQL（复杂）

如果你想在本地运行 PostgreSQL：

#### 1. 安装 PostgreSQL
- Windows: 下载官方安装包
- macOS: `brew install postgresql`
- Linux: `sudo apt install postgresql`

#### 2. 创建数据库
```sql
-- 连接到 PostgreSQL
psql -U postgres

-- 创建数据库和用户
CREATE DATABASE climbing_wall_db;
CREATE USER climbing_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE climbing_wall_db TO climbing_user;
```

#### 3. 配置环境变量
```bash
DATABASE_URL="postgresql://climbing_user:your_password@localhost:5432/climbing_wall_db"
DIRECT_URL="postgresql://climbing_user:your_password@localhost:5432/climbing_wall_db"
```

## 🚀 配置完成后的步骤

无论选择哪种方案，配置好 `DATABASE_URL` 后：

```bash
# 1. 生成 Prisma Client
npm run db:generate

# 2. 创建数据库表
npm run db:push

# 3. 初始化数据
npm run db:init

# 4. 启动开发服务器
npm run dev
```

## 🔍 验证配置

访问管理后台检查数据库状态：
1. 打开 `http://localhost:3000/admin`
2. 进入"系统设置"页面
3. 查看"数据库状态"显示为"PostgreSQL"且"在线"

## 💡 推荐做法

**强烈推荐使用方案一**（Vercel Postgres），因为：
- ✅ 本地和生产环境使用同一数据库，真正实现数据同步
- ✅ 不需要额外的数据库服务
- ✅ 自动备份和维护
- ✅ 配置简单
- ✅ 免费额度充足

## 🆘 如果还有问题

如果配置完成后还有错误，请检查：

1. **连接字符串格式**：确保以 `postgresql://` 开头
2. **网络连接**：确保能访问数据库服务器
3. **认证信息**：确保用户名和密码正确
4. **SSL设置**：大多数云数据库需要 SSL 连接

可以使用以下命令测试连接：
```bash
# 测试数据库连接
npx prisma db push --preview-feature
``` 