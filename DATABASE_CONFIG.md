# 数据库配置指南 - 解决 GitHub 安全限制

## ⚠️ 问题说明

GitHub 会自动检测和阻止包含 PostgreSQL 连接字符串的提交，因为它们包含敏感信息。

## 🚀 推荐解决方案

### 方案一：使用 Supabase（免费且简单）

1. **注册 Supabase 账户**
   - 访问 [supabase.com](https://supabase.com)
   - 使用 GitHub 账户登录

2. **创建项目**
   - 点击 "New Project"
   - 选择组织和输入项目名称
   - 设置数据库密码（记住这个密码）
   - 选择地区（建议选择新加坡）

3. **获取连接信息**
   - 进入项目 Dashboard
   - 点击左侧 "Settings" > "Database"
   - 找到 "Connection string" 部分
   - 复制 URI 格式的连接字符串

4. **配置环境变量**
   - 打开 `.env.local` 文件
   - 替换连接字符串（不要提交到 Git）

### 方案二：本地开发 + Vercel 生产环境

1. **本地开发使用 SQLite**
   - 在 `.env.local` 中设置：
   ```
   DATABASE_URL="file:./prisma/dev.db"
   ```

2. **生产环境使用 Vercel Postgres**
   - 在 Vercel 项目设置中添加环境变量
   - 不在本地文件中存储生产数据库连接

### 方案三：环境变量注入（推荐用于演示）

我将为您设置一个可以运行时配置数据库的方案，无需在文件中硬编码连接字符串。

## 连接字符串格式示例

```
# Supabase 格式
DATABASE_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres"

# 本地 SQLite 格式  
DATABASE_URL="file:./prisma/dev.db"
```

## 🛡️ 安全注意事项

- 永远不要将真实的数据库连接字符串提交到 Git
- 使用 `.env.local` 文件存储敏感信息（已在 .gitignore 中）
- 生产环境使用环境变量而不是文件配置

## 创建环境变量文件

请在项目根目录手动创建 `.env.local` 文件，并添加以下内容：

```env
# 主数据库连接URL（用于应用程序连接）
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# 直接连接URL（用于 Prisma 迁移和管理操作）  
DIRECT_URL="postgresql://username:password@host:port/database?sslmode=require&connection_limit=1"
```

## 如何获取 Vercel Postgres 连接字符串

1. **登录 Vercel 控制台**
   - 访问 [vercel.com](https://vercel.com)
   - 登录您的账户

2. **进入项目设置**
   - 选择您的项目
   - 点击 **Storage** 标签页

3. **创建 Postgres 数据库**（如果还没有）
   - 点击 **Create Database**
   - 选择 **Postgres**
   - 选择地区（建议选择离您最近的）
   - 点击 **Create**

4. **获取连接字符串**
   - 点击您创建的数据库
   - 点击 **Connect** 按钮
   - 复制 `DATABASE_URL` 和 `DIRECT_URL`

5. **配置本地环境**
   - 在项目根目录创建 `.env.local` 文件
   - 粘贴连接字符串
   - 保存文件

## 注意事项

- `.env.local` 文件不会被提交到 Git（已在 .gitignore 中配置）
- 连接字符串必须以 `postgresql://` 或 `postgres://` 开头
- 配置完成后重启开发服务器：`npm run dev`

## 验证配置

配置完成后，您可以运行以下命令验证数据库连接：

```bash
npx prisma db push
```

如果连接成功，您将看到数据库模式已同步的消息。 