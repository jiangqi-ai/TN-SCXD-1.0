'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Eye, EyeOff, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CreateUserPage() {
  const router = useRouter();
  const { user, isAuthenticated, register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    company: '',
    contact: '',
    role: 'customer' as 'admin' | 'customer'
  });

  // 检查管理员权限
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      toast.error('无权访问此页面');
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim() || !formData.name.trim() || !formData.contact.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    // 密码长度验证
    if (formData.password.length < 6) {
      toast.error('密码至少需要6个字符');
      return;
    }

    try {
      await register(formData);
      toast.success(`${formData.role === 'admin' ? '管理员' : '用户'}创建成功`);
      router.push('/admin');
    } catch (error) {
      // 错误处理已在store中完成
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 如果不是管理员，不显示页面
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回管理后台
            </Button>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 font-bold text-3xl text-gray-900">创建新用户</h1>
          <p className="text-gray-600">
            为攀岩定制系统添加新的用户账户
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">用户信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="role">用户类型 *</Label>
                <Select value={formData.role} onValueChange={(value: 'admin' | 'customer') => setFormData({...formData, role: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择用户类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">普通用户</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">用户名 *</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="请输入用户名"
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="name">真实姓名 *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="请输入真实姓名"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">邮箱地址 *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="请输入邮箱地址"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">初始密码 *</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="请输入初始密码（至少6位）"
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="contact">联系电话 *</Label>
                <Input
                  id="contact"
                  name="contact"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="请输入联系电话"
                  value={formData.contact}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="company">公司名称</Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  placeholder="请输入公司名称（可选）"
                  value={formData.company}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '创建中...' : `创建${formData.role === 'admin' ? '管理员' : '用户'}账户`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 