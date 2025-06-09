# 定制系统 (TN-SCXD-1.0)

一个基于 Next.js 15 和 SQLite 的现代定制系统，支持产品管理、订单处理和用户管理。

## ✨ 主要功能

### 🏗️ 产品管理
- 攀岩墙产品展示和筛选
- 多规格、多颜色选择
- 产品图片和详细信息
- 管理员产品编辑和状态管理

### 🛒 订单系统
- 购物车功能
- 订单创建和状态跟踪
- 合同生成和PDF导出
- 订单数据导出（Excel/PDF）

### 👥 用户管理
- 用户注册和登录
- 角色权限控制（管理员/客户）
- 客户类型分类
- 安全会话管理

### 📊 管理后台
- 订单管理和状态更新
- 客户信息管理
- 产品库存管理
- 数据统计和报表

## 🚀 技术栈

- **前端**: Next.js 15 (App Router), React 18, TypeScript
- **样式**: Tailwind CSS, shadcn/ui 组件库
- **数据库**: SQLite + Prisma ORM
- **状态管理**: Zustand
- **表单处理**: React Hook Form
- **文件处理**: xlsx, jsPDF
- **通知**: Sonner Toast

## 📦 安装和运行

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd TN-SCXD-1.0
```

2. **安装依赖**
```bash
npm install
```

3. **数据库设置**
```bash
# 推送数据库架构
npm run db:push

# 初始化示例数据
npm run db:init

# 生成Prisma客户端
npm run db:generate
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
- 主应用: http://localhost:3000
- 数据库管理: http://localhost:5555 (Prisma Studio)

## 🔑 默认账户

### 管理员账户
- 用户名: `admin`
- 密码: `admin123`

### 客户账户
- 用户名: `customer`
- 密码: `customer123`

## 📁 项目结构

```
TN-SCXD-1.0/
├── src/
│   ├── app/                    # Next.js App Router页面
│   │   ├── admin/             # 管理后台
│   │   ├── api/               # API路由
│   │   ├── products/          # 产品页面
│   │   ├── cart/              # 购物车
│   │   └── orders/            # 订单管理
│   ├── components/            # React组件
│   │   ├── ui/                # shadcn/ui组件
│   │   └── ...                # 业务组件
│   ├── lib/                   # 工具库
│   │   ├── services/          # 业务服务
│   │   └── utils/             # 工具函数
│   ├── store/                 # Zustand状态管理
│   └── types/                 # TypeScript类型定义
├── prisma/                    # 数据库配置
│   ├── schema.prisma          # 数据库模式
│   └── dev.db                 # SQLite数据库文件
├── scripts/                   # 脚本文件
└── public/                    # 静态资源
```

## 🗄️ 数据库管理

### 常用命令
```bash
# 查看数据库
npm run db:studio

# 重置数据库
npm run db:reset

# 重新初始化数据
npm run db:init
```

### 数据模型
- **User**: 用户信息和认证
- **Product**: 产品信息和规格
- **Order**: 订单和订单项
- **Contract**: 合同信息

## 🔧 开发指南

### API端点
- `GET /api/products` - 获取产品列表
- `PATCH /api/products/[id]/toggle` - 切换产品状态

### 状态管理
- `useAuthStore` - 用户认证状态
- `useCartStore` - 购物车状态

### 组件库
项目使用 shadcn/ui 组件库，所有UI组件位于 `src/components/ui/`

## 📋 功能特性

### 🔐 安全特性
- JWT会话管理
- 角色权限控制
- 安全登录验证
- 会话超时处理

### 📱 响应式设计
- 移动端适配
- 平板端优化
- 桌面端完整功能

### 🎨 用户体验
- 现代化UI设计
- 流畅的交互动画
- 直观的操作流程
- 实时状态反馈

## 🚀 部署

### 生产环境部署
1. 构建项目
```bash
npm run build
```

2. 启动生产服务器
```bash
npm start
```

### 环境变量
项目使用 `.env` 文件配置数据库连接：
```
DATABASE_URL="file:./prisma/dev.db"
```

## 📄 许可证

本项目仅用于演示目的。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

---

**注意**: 这是一个演示项目，不建议直接用于生产环境。在生产使用前请进行适当的安全审查和性能优化。
