# 安全配置指南

本文档说明如何安全地配置攀岩墙定制系统的敏感信息。

## 📋 必需步骤

### 1. 创建环境变量文件

```bash
# 复制示例文件
cp env.example .env
```

### 2. 修改默认密码

**⚠️ 重要：生产环境必须修改默认密码！**

在 `.env` 文件中设置：

```bash
# 使用强密码
DEFAULT_ADMIN_PASSWORD=YourSecureAdminPassword123!
DEFAULT_CUSTOMER_PASSWORD=YourSecureCustomerPassword456!
```

### 3. 设置 JWT 密钥

```bash
# 生成一个复杂的随机字符串
JWT_SECRET=your-complex-jwt-secret-key-min-32-characters-long
```

**生成随机密钥的方法：**

```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用在线工具
# https://www.uuidgenerator.net/
```

## 🔒 安全最佳实践

### 开发环境

1. **永远不要提交 `.env` 文件到版本控制**
   ```bash
   # 确保 .gitignore 包含：
   .env
   .env.local
   .env.production
   ```

2. **使用不同的密码进行测试**
   - 开发环境使用简单密码便于测试
   - 生产环境使用复杂密码

### 生产环境

1. **密码复杂度要求**：
   - 至少 12 个字符
   - 包含大小写字母、数字、特殊字符
   - 避免使用常见词汇

2. **定期更换密码**：
   - 建议每 90 天更换一次
   - 立即更换任何可能泄露的密码

3. **环境变量设置**：
   ```bash
   # Vercel 部署
   # 在 Vercel Dashboard 的 Environment Variables 中设置

   # Docker 部署
   docker run -e DEFAULT_ADMIN_PASSWORD=xxx -e JWT_SECRET=xxx ...

   # 服务器部署
   export DEFAULT_ADMIN_PASSWORD=xxx
   export JWT_SECRET=xxx
   ```

## 🚨 发现安全问题？

如果您发现任何安全漏洞或硬编码的敏感信息，请：

1. **不要**在公开的 issue 中报告
2. 通过私密渠道联系维护者
3. 提供详细的复现步骤

## ✅ 安全检查清单

部署前请确认：

- [ ] `.env` 文件已创建并配置
- [ ] 所有默认密码已修改
- [ ] JWT 密钥已设置为复杂字符串
- [ ] `.env` 文件未被提交到版本控制
- [ ] 生产环境的环境变量已正确设置
- [ ] 测试了登录功能正常工作

## 📚 相关文档

- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel 环境变量设置](https://vercel.com/docs/concepts/projects/environment-variables)

---

**安全无小事，请认真对待每一个配置！** 🔐 