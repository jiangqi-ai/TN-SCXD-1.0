const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 创建导出目录
const exportDir = './export';
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

// 创建zip文件
const output = fs.createWriteStream(path.join(exportDir, `TN-SCXD-项目包_${new Date().toISOString().slice(0, 10)}.zip`));
const archive = archiver('zip', {
  zlib: { level: 9 } // 最高压缩级别
});

// 监听事件
output.on('close', function() {
  console.log('✅ 项目打包完成！');
  console.log(`📦 文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📁 导出位置: ${path.resolve(exportDir)}`);
});

archive.on('error', function(err) {
  throw err;
});

// 连接输出流
archive.pipe(output);

// 添加项目文件
console.log('🚀 开始打包项目...');

// 排除的文件和目录
const excludePatterns = [
  'node_modules/**',
  '.next/**',
  '.git/**',
  '.env*',
  'export/**',
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '.DS_Store',
  'Thumbs.db',
  'export.js',
  'export.cjs'
];

// 添加所有项目文件，但排除指定的文件
archive.glob('**/*', {
  ignore: excludePatterns
});

// 完成打包
archive.finalize(); 