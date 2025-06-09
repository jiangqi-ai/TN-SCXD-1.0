# 🚀 部署指南 - 使用 Vercel Postgres 实现数据同步

## 概述

本指南将帮助你将项目从 SQLite 迁移到 Vercel Postgres，解决数据不同步的问题。完成后，所有用户将共享同一个数据库，实现真正的数据同步。

## 🔄 迁移步骤

### 第一步：在 Vercel 上配置 PostgreSQL 数据库

1. **登录 Vercel Dashboard**
   - 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - 选择你的项目

2. **添加数据库**
   - 点击项目页面的 **Storage** 标签
   - 点击 **Connect Database** 按钮
   - 选择 **Postgres** 选项
   - 推荐选择 **Neon** 作为提供商（免费额度较大）
   - 按照提示创建数据库

3. **获取连接信息**
   
   创建完成后，Vercel 会自动添加这些环境变量：
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_DATABASE`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_USER`

### 第二步：配置环境变量

在 Vercel 项目设置中，确保以下环境变量已正确设置：

```
DATABASE_URL=${POSTGRES_PRISMA_URL}
DIRECT_URL=${POSTGRES_URL_NON_POOLING}
```

### 第三步：重新部署项目

1. **提交当前更改**
   ```bash
   git add .
   git commit -m "feat: 迁移到 PostgreSQL 数据库"
   git push origin main
   ```

2. **触发部署**
   - 推送代码后 Vercel 会自动重新部署
   - 或者在 Vercel Dashboard 中手动触发部署

### 第四步：初始化数据库

部署完成后，数据库表会自动创建，但需要初始化数据：

1. **方法一：通过 Vercel CLI**
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel@latest
   
   # 登录并链接项目
   vercel login
   vercel link
   
   # 运行初始化命令
   vercel env pull .env.local
   npm run db:init
   ```

2. **方法二：通过管理后台**
   - 访问部署后的网站 `/admin`
   - 如果无法登录，说明数据库为空
   - 联系技术人员进行数据初始化

### 第五步：验证数据同步

1. **检查数据库状态**
   - 登录管理后台 `/admin`
   - 查看 "系统设置" 页面中的 "数据库状态"
   - 确认显示为 "PostgreSQL" 且状态为 "在线"

2. **测试数据同步**
   - 在不同设备上登录同一账号
   - 添加产品或创建订单
   - 验证数据在所有设备上都能看到

## 🔧 本地开发配置

如果你需要在本地连接到 Vercel Postgres：

```bash
# 下载环境变量
vercel env pull .env.local

# 生成 Prisma Client
npm run db:generate

# 启动开发服务器
npm run dev
```

## 📋 默认账户信息

数据库初始化后，将创建以下默认账户：

- **管理员账户**
  - 用户名: `admin`
  - 密码: `admin123`

- **客户账户**
  - 用户名: `customer`
  - 密码: `customer123`

## 🛠️ 故障排除

### 问题1：数据库连接失败

**症状**: 网站报错或管理后台显示数据库离线

**解决方案**:
1. 检查 Vercel 项目中的环境变量是否正确设置
2. 确认 `DATABASE_URL` 和 `DIRECT_URL` 变量存在
3. 重新部署项目

### 问题2：表不存在

**症状**: 数据库连接正常，但查询报错表不存在

**解决方案**:
```bash
# 推送数据库 schema
vercel env pull .env.local
npm run db:push
npm run db:init
```

### 问题3：数据为空

**症状**: 无法登录，或者产品列表为空

**解决方案**:
```bash
# 重新初始化数据
npm run db:init
```

### 问题4：旧数据迁移

如果你有重要的 SQLite 数据需要迁移：

1. **导出现有数据**
   ```bash
   # 使用 Prisma Studio 导出数据
   npm run db:studio
   ```

2. **手动导入**
   - 通过管理后台逐个添加重要数据
   - 或联系技术人员协助批量导入

## 🔒 安全注意事项

1. **更改默认密码**
   - 部署后立即修改管理员和测试账户密码

2. **环境变量安全**
   - 不要将数据库连接字符串提交到代码库
   - 定期检查 Vercel 项目的访问权限

3. **数据备份**
   - Neon 自动提供数据备份
   - 考虑定期手动导出重要数据

## 📈 性能优化

1. **连接池配置**
   - Vercel Postgres 自动管理连接池
   - 无需额外配置

2. **查询优化**
   - 定期检查慢查询
   - 考虑添加数据库索引

## 🆘 获取帮助

如果遇到问题，可以：

1. 查看 [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
2. 查看 [Neon 文档](https://neon.tech/docs)
3. 检查项目的构建日志
4. 联系技术支持

---

**重要提醒**: 完成迁移后，所有数据将存储在云端数据库中，实现真正的多设备同步。请确保备份重要数据，并测试所有功能正常工作。 