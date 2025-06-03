# 攀岩墙定制系统

一个基于 Next.js 的 B2B 攀岩墙定制系统，提供完整的产品管理、订单管理和用户管理功能。

## ✨ 功能特点

### 前台功能
- 🏠 产品展示和浏览
- 🔍 产品详情查看和规格选择
- 🛒 购物车管理
- 📋 订单查看和管理
- 👤 用户注册和登录

### 后台管理
- 📊 数据统计面板
- 📦 产品管理（Excel批量上传、编辑）
- 👥 客户管理（查看、编辑、添加）
- 👤 用户管理（查看、编辑、添加、角色管理）
- 📋 订单管理（状态更新、生产管理、出货通知）
- ⚙️ 系统设置

### 技术特性
- ✅ TypeScript 类型安全
- ✅ 响应式设计
- ✅ 多颜色和尺寸选择
- ✅ Excel 文件上传处理
- ✅ 实时价格计算
- ✅ 运费到付模式

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn

### 1. 安装依赖
```bash
npm install
```

### 2. 环境变量配置
创建 `.env` 文件并复制 `env.example` 的内容：

```bash
cp env.example .env
```

编辑 `.env` 文件配置以下变量：

```bash
# 默认用户密码配置
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_CUSTOMER_PASSWORD=customer123

# JWT密钥 (生产环境中使用复杂的随机字符串)
JWT_SECRET=your-jwt-secret-key-here

# 应用配置
NEXT_PUBLIC_APP_NAME=攀岩墙定制系统
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. 启动开发服务器
```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 4. 构建生产版本
```bash
npm run build
npm start
```

## 🔐 默认账户

### 管理员账户
- 用户名：`admin`
- 密码：`admin123`（可通过环境变量修改）

### 客户账户
- 用户名：`customer1`
- 密码：`customer123`（可通过环境变量修改）

## 📁 项目结构

```
src/
├── app/                 # Next.js 13+ App Router
│   ├── admin/          # 管理后台页面
│   ├── products/       # 产品相关页面
│   ├── orders/         # 订单相关页面
│   └── ...
├── components/         # UI 组件
│   ├── ui/            # shadcn/ui 组件
│   └── Navigation.tsx  # 导航组件
├── lib/               # 工具函数和服务
│   ├── services/      # 数据服务
│   └── utils/         # 工具函数
├── store/             # Zustand 状态管理
├── styles/            # 样式文件
└── types/             # TypeScript 类型定义
```

## 🔧 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|---------|
| `DEFAULT_ADMIN_PASSWORD` | 默认管理员密码 | `admin123` |
| `DEFAULT_CUSTOMER_PASSWORD` | 默认客户密码 | `customer123` |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | `攀岩墙定制系统` |
| `NEXT_PUBLIC_APP_VERSION` | 应用版本 | `1.0.0` |

## 🔒 安全注意事项

1. **生产环境部署前**：
   - 修改所有默认密码
   - 使用复杂的 JWT 密钥
   - 确保 `.env` 文件不被提交到版本控制

2. **密码安全**：
   - 生产环境使用强密码
   - 定期更换密码
   - 考虑实现密码加密存储

## 🚀 部署指南

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 点击部署

### 其他平台

确保在部署平台配置所有必要的环境变量。

## 📄 许可证

MIT License - 可自由使用和修改。

---

**开始您的攀岩墙定制业务！** 🏔️