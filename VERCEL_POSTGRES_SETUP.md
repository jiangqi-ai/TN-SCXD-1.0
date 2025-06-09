# Vercel Postgres 数据库配置指南

## 第一步：在 Vercel 上添加 PostgreSQL 数据库

1. 打开你的 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目页面
3. 点击 **Storage** 标签
4. 点击 **Connect Database** 按钮
5. 选择 **Postgres** 选项
6. 选择一个提供商（推荐 **Neon**，因为它是免费的）
7. 按照提示创建数据库

## 第二步：获取数据库连接信息

创建数据库后，Vercel 会自动为你的项目添加以下环境变量：
- `DATABASE_URL` - 数据库连接字符串
- `POSTGRES_URL` - Postgres 连接字符串
- `POSTGRES_PRISMA_URL` - Prisma 连接字符串
- `POSTGRES_URL_NON_POOLING` - 直接连接字符串

## 第三步：配置环境变量

在 Vercel 项目设置中，确保以下环境变量已设置：

```
DATABASE_URL=<你的 POSTGRES_PRISMA_URL>
DIRECT_URL=<你的 POSTGRES_URL_NON_POOLING>
```

## 第四步：本地开发设置

为了在本地也能连接到 Vercel Postgres，你需要：

1. 安装 Vercel CLI：
```bash
npm i -g vercel@latest
```

2. 登录并链接项目：
```bash
vercel login
vercel link
```

3. 下载环境变量：
```bash
vercel env pull .env.local
```

## 第五步：初始化数据库

运行以下命令来创建数据库表和初始数据：

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库 schema
npm run db:push

# 初始化默认数据
npm run db:init
```

## 第六步：验证配置

1. 本地运行项目：
```bash
npm run dev
```

2. 检查是否可以正常访问和操作数据

3. 部署到 Vercel：
```bash
vercel deploy --prod
```

## 故障排除

### 问题1：连接被拒绝
- 确保 `DATABASE_URL` 和 `DIRECT_URL` 正确设置
- 检查防火墙设置

### 问题2：表不存在
- 运行 `npm run db:push` 创建表
- 检查 Prisma schema 是否正确

### 问题3：权限错误
- 确保数据库用户有足够权限
- 检查连接字符串中的用户名和密码

## 注意事项

1. **环境变量安全**：不要将数据库连接字符串提交到代码仓库
2. **生产环境**：确保在生产环境中使用强密码
3. **备份**：定期备份重要数据
4. **监控**：监控数据库使用情况和性能

## 数据迁移

如果你有现有的 SQLite 数据需要迁移，可以：

1. 导出现有数据
2. 使用 Prisma Studio 或 SQL 脚本导入数据
3. 验证数据完整性

## 获取帮助

- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [Neon 文档](https://neon.tech/docs)
- [Prisma 文档](https://www.prisma.io/docs) 