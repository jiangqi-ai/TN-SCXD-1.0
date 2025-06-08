# TN-SCXD 

全功能管理系统，支持产品管理、订单处理、用户管理和云端数据同步。

## ✨ 核心功能

- 🏗️ **产品管理** - 完整的产品CRUD操作，支持多规格、多颜色配置
- 📦 **订单管理** - 在线下单、状态跟踪、订单导出
- 👥 **用户系统** - 多角色权限管理，安全认证
- ☁️ **云端同步** - 跨设备数据同步，基于JSONBin.io
- 📊 **Excel导入导出** - 批量产品上传，订单数据导出
- 📱 **响应式设计** - 支持桌面和移动设备

## 🚀 快速开始

### 系统要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

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

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问: http://localhost:3000

## 🔐 默认账户

### 管理员账户
- **用户名**: admin
- **密码**: admin123
- **权限**: 完整系统管理权限

### 客户账户
- **用户名**: customer1
- **密码**: customer123
- **权限**: 产品浏览和订单管理

## 📝 可用脚本

```bash
# 开发环境
npm run dev              # 启动开发服务器

# 生产环境
npm run build           # 构建生产版本
npm run start           # 启动生产服务器
npm run deploy          # 构建并打包

# 工具
npm run clean           # 清理构建文件
npm run typecheck       # TypeScript 类型检查
npm run check           # 代码质量检查
```

## 🌐 云端同步配置

系统支持跨设备数据同步，配置步骤：

1. 注册 JSONBin.io 账户: https://jsonbin.io
2. 获取 Master Key
3. 登录管理员账户
4. 进入 管理后台 → 系统设置 → 云端同步配置
5. 输入 API Key 并保存
6. 系统将自动开始云端同步

## 🛠 技术栈

### 前端技术
- **框架**: Next.js 15 (App Router)
- **UI库**: React 19
- **样式**: Tailwind CSS + Shadcn/ui
- **状态管理**: Zustand
- **类型检查**: TypeScript

### 后端技术
- **API**: Next.js API Routes
- **数据存储**: LocalStorage + 云端同步
- **文件处理**: XLSX, jsPDF
- **安全**: 自定义认证系统

## 📁 项目结构

```
src/
├── app/                 # Next.js 13+ 应用路由
│   ├── admin/          # 管理员页面
│   ├── orders/         # 订单管理
│   ├── products/       # 产品展示
│   └── ...
├── components/         # React 组件
│   └── ui/            # UI 组件库
├── lib/               # 工具库和服务
│   ├── services/      # 业务服务
│   └── utils/         # 工具函数
├── store/             # Zustand 状态管理
└── types/             # TypeScript 类型定义
```

## 🎯 主要特性

### 产品管理
- 支持多种产品规格和颜色配置
- 批量Excel导入产品数据
- 产品状态管理（启用/禁用）
- 客户类型筛选显示

### 订单系统
- 在线购物车和下单流程
- 订单状态跟踪（待确认→已确认→生产中→已完成）
- 订单导出（Excel/PDF格式）
- 客户订单历史查询

### 用户管理
- 多角色权限系统
- 安全登录认证
- 用户会话管理
- IP访问控制

### 数据同步
- 云端数据实时同步
- 多设备数据一致性
- 自动故障恢复
- 手动备份功能

## 🚢 部署说明

### 生产环境部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **打包部署文件**
   ```bash
   npm run package
   ```

3. **部署到服务器**
   ```bash
   # 上传 dist/*.zip 到服务器
   unzip tn-scxd-production-*.zip
   npm install --production
   npm start
   ```

### 环境配置

复制 `env.example` 为 `.env.local` 并配置相应的环境变量（可选）。

## 🔧 自定义开发

### 添加新功能
1. 在 `src/app/` 下创建新的路由页面
2. 在 `src/components/` 下创建新的组件
3. 在 `src/lib/services/` 下添加业务逻辑
4. 在 `src/types/` 下定义相关类型

### 修改样式
项目使用 Tailwind CSS，可以直接修改组件的 className 或在 `tailwind.config.js` 中配置主题。

## 📞 技术支持

如有问题或建议，请联系技术支持团队。

## 📄 许可证

本项目仅供学习和演示使用。

---

**版本**: 1.0.0  
**构建日期**: 2025-06-08  
**状态**: ✅ 生产就绪
