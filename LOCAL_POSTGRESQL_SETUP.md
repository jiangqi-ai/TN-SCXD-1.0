# 本地 PostgreSQL 数据库安装和配置指南

## 🔧 Windows 安装步骤

### 1. 下载和安装 PostgreSQL
1. 访问 [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. 下载最新版本的 PostgreSQL（推荐 15.x 或 16.x）
3. 运行安装程序
4. 安装过程中记住设置的 **超级用户密码**

### 2. 创建项目数据库
打开 pgAdmin 或使用命令行：

```sql
-- 创建数据库
CREATE DATABASE climbing_gear_system;

-- 创建用户
CREATE USER climbing_user WITH ENCRYPTED PASSWORD 'your_password_here';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE climbing_gear_system TO climbing_user;
```

### 3. 获取连接字符串
```
postgresql://climbing_user:your_password_here@localhost:5432/climbing_gear_system
```

## 🐧 Linux (Ubuntu/Debian) 安装

```bash
# 更新包列表
sudo apt update

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib

# 切换到 postgres 用户
sudo -u postgres psql

# 在 psql 中执行：
CREATE DATABASE climbing_gear_system;
CREATE USER climbing_user WITH ENCRYPTED PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE climbing_gear_system TO climbing_user;
\q
```

## 🍎 macOS 安装

```bash
# 使用 Homebrew 安装
brew install postgresql

# 启动服务
brew services start postgresql

# 创建数据库
createdb climbing_gear_system

# 连接并创建用户
psql climbing_gear_system
```

## 🔍 验证安装

使用以下命令测试连接：

```bash
psql "postgresql://climbing_user:your_password_here@localhost:5432/climbing_gear_system"
```

如果连接成功，您会看到 psql 提示符。 