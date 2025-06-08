import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'dist');
const packageName = `tn-scxd-production-${new Date().toISOString().slice(0, 10)}.zip`;
const outputPath = path.join(outputDir, packageName);

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 创建zip文件
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // 最高压缩级别
});

output.on('close', () => {
  console.log("✅ 打包完成！");
  console.log(`📦 文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📁 输出路径: ${outputPath}`);
  console.log("\n🚀 部署说明:");
  console.log(`1. 解压 ${packageName}`);
  console.log("2. 运行 npm install --production");
  console.log("3. 运行 npm start");
  console.log("4. 访问 http://localhost:3000");
});

archive.on('error', (err) => {
  console.error('❌ 打包失败:', err);
  process.exit(1);
});

archive.pipe(output);

console.log('🔄 开始打包生产环境文件...');

// 需要包含的文件和目录
const filesToInclude = [
  '.next',
  'public',
  'package.json',
  'next.config.js',
  'README.md'
];

// 添加文件到压缩包
filesToInclude.forEach(item => {
  const itemPath = path.join(projectRoot, item);
  
  if (fs.existsSync(itemPath)) {
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      console.log(`📁 添加目录: ${item}`);
      archive.directory(itemPath, item);
    } else {
      console.log(`📄 添加文件: ${item}`);
      archive.file(itemPath, { name: item });
    }
  } else {
    console.log(`⚠️  文件不存在，跳过: ${item}`);
  }
});

// 创建部署说明文件
const deploymentInstructions = `# TN-SCXD 攀岩产品管理系统 - 部署说明

## 系统要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

## 部署步骤

### 1. 解压文件
将压缩包解压到服务器目录

### 2. 安装依赖
\`\`\`bash
npm install --production
\`\`\`

### 3. 启动服务
\`\`\`bash
npm start
\`\`\`

### 4. 访问系统
打开浏览器访问: http://localhost:3000

## 默认账户信息

### 管理员账户
- 用户名: admin
- 密码: admin123

### 客户账户
- 用户名: customer1
- 密码: customer123

## 功能特性
- ✅ 产品管理 (增删改查)
- ✅ 订单管理
- ✅ 用户管理
- ✅ 云端数据同步 (JSONBin.io)
- ✅ Excel 导入导出
- ✅ 安全认证
- ✅ 响应式设计

## 云端同步配置
1. 注册 JSONBin.io 账户: https://jsonbin.io
2. 获取 API Key
3. 在管理员后台 -> 系统设置 -> 云端同步配置中填入 API Key
4. 系统将自动同步产品数据到云端

## 技术栈
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand (状态管理)
- Shadcn/ui (UI组件)

## 支持与维护
如有问题请联系技术支持。

构建时间: ${new Date().toLocaleString('zh-CN')}
版本: 1.0.0
`;

archive.append(deploymentInstructions, { name: 'DEPLOYMENT.md' });

// 完成打包
archive.finalize(); 