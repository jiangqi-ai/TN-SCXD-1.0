# Vercel 部署指南

## 📋 部署前检查

✅ **构建成功**：本地运行 `npm run build` 无错误  
✅ **兼容性配置**：已配置Vercel环境检测和localStorage回退  
✅ **TypeScript**：已禁用严格模式以兼容Prisma  
✅ **API路由**：使用localStorage服务，避免数据库依赖  

## 🚀 部署步骤

### 1. 连接GitHub仓库
1. 将代码推送到GitHub仓库
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 导入项目
3. 选择你的GitHub仓库

### 2. 配置构建设置
在Vercel项目设置中：

**Build & Development Settings:**
- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Output Directory: `.next` (默认)
- Install Command: `npm install`

### 3. 环境变量配置
在Vercel项目设置 → Environment Variables 中添加：

```bash
DISABLE_DATABASE=true
NODE_ENV=production
```

### 4. 部署配置文件
项目已包含 `vercel.json` 配置文件：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "file:./prisma/dev.db"
  }
}
```

## ⚡ 自动部署
- 推送到 `main` 分支会自动触发部署
- 每次推送都会创建一个预览部署
- 生产部署需要手动从Dashboard确认

## 🔧 技术说明

### 存储方案
- **本地开发**：使用SQLite数据库
- **Vercel生产**：自动切换到localStorage
- **数据持久化**：通过浏览器localStorage实现

### 兼容性处理
1. **环境检测**：`isVercelEnvironment()` 检测运行环境
2. **服务切换**：自动在数据库和localStorage间切换
3. **构建优化**：配置webpack外部依赖排除Prisma

### API路由
- 产品API：`/api/products` 和 `/api/products/[id]/toggle`
- 数据源：localStorage（在Vercel环境下）
- 响应格式：与数据库版本完全兼容

## 📱 功能验证

部署后请验证以下功能：

**基础功能**
- [ ] 首页加载正常
- [ ] 产品列表显示
- [ ] 用户登录/注册
- [ ] 购物车功能

**管理功能**
- [ ] 管理员登录（admin/admin123）
- [ ] 产品管理
- [ ] 订单管理
- [ ] 用户管理

**数据持久化**
- [ ] 刷新页面数据保持
- [ ] 登录状态保持
- [ ] 购物车状态保持

## 🐛 常见问题

### 1. 构建失败
如果出现Prisma相关错误：
```bash
# 本地清理重新构建
npm run clean
npm install
npm run build
```

### 2. 环境变量问题
确保Vercel环境变量设置正确：
- `DISABLE_DATABASE=true`
- `NODE_ENV=production`

### 3. 数据丢失
Vercel环境使用localStorage：
- 数据存储在用户浏览器
- 清除浏览器数据会丢失
- 不同设备数据不同步

## 🎯 性能优化

### 部署优化
- 静态页面预渲染
- 代码分割和懒加载
- 图片优化和CDN

### 用户体验
- 数据本地缓存
- 离线功能支持
- 快速页面加载

## 🔗 有用链接

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [项目GitHub仓库](#)
- [演示站点](#)

---

## 📞 支持

如遇到部署问题，请检查：
1. 构建日志错误信息
2. 环境变量配置
3. 代码版本是否最新

**联系方式**：请在GitHub仓库提交Issue 