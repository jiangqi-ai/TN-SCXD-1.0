'use client';

import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAuthService } from '@/lib/services/mockDataService';
import { securityService } from '@/lib/services/securityService';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  AlertTriangle, 
  Ban,
  Clock,
  Eye,
  Monitor, 
  RefreshCw,
  Shield, 
  Trash2,
  Users 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SecurityStats {
  blockedIPs: number;
  activeAttempts: number;
  activeSessions: number;
  sessionStats: { 
    totalSessions: number; 
    sessionsByIP: { [ip: string]: number } 
  };
}

export default function SecurityManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 权限检查
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'admin') {
      toast.error('权限不足');
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // 加载安全统计
  const loadSecurityStats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const securityStats = await mockAuthService.getSecurityStats(user.id);
      setStats(securityStats);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载失败';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadSecurityStats();
    }
  }, [user]);

  // 清理安全数据
  const handleClearSecurityData = () => {
    if (confirm('确定要清理所有安全数据吗？这将清除所有IP阻止记录和登录尝试记录。')) {
      securityService.clearAllSecurityData();
      toast.success('安全数据已清理');
      loadSecurityStats();
    }
  };

  // 如果用户不是管理员，不渲染页面
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* 页面标题 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 font-bold text-2xl text-gray-900 sm:text-3xl">
                安全管理
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                监控和管理系统安全状态
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={loadSecurityStats}
                disabled={isLoading}
                size="sm"
                className="text-sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button 
                onClick={handleClearSecurityData}
                variant="destructive"
                size="sm"
                className="text-sm"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                清理数据
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 rounded bg-gray-200"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 rounded bg-gray-200"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* 安全统计卡片 */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {/* 被阻止的IP */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Ban className="h-4 w-4 text-red-600 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">被阻止IP</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl text-red-600 sm:text-3xl">
                    {stats.blockedIPs}
                  </div>
                  <p className="mt-1 text-gray-500 text-xs sm:text-sm">
                    当前被阻止的IP地址数量
                  </p>
                </CardContent>
              </Card>

              {/* 活跃登录尝试 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">登录尝试</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl text-yellow-600 sm:text-3xl">
                    {stats.activeAttempts}
                  </div>
                  <p className="mt-1 text-gray-500 text-xs sm:text-sm">
                    近期活跃的登录尝试
                  </p>
                </CardContent>
              </Card>

              {/* 活跃会话 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">活跃会话</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl text-green-600 sm:text-3xl">
                    {stats.activeSessions}
                  </div>
                  <p className="mt-1 text-gray-500 text-xs sm:text-sm">
                    当前在线用户数量
                  </p>
                </CardContent>
              </Card>

              {/* 设备分布 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Monitor className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">设备数量</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl text-blue-600 sm:text-3xl">
                    {Object.keys(stats.sessionStats.sessionsByIP).length}
                  </div>
                  <p className="mt-1 text-gray-500 text-xs sm:text-sm">
                    不同IP设备数量
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 详细信息 */}
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              {/* 会话分布 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
                    IP会话分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.sessionStats.sessionsByIP).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.sessionStats.sessionsByIP).map(([ip, count]) => (
                        <div key={ip} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <span className="font-mono text-sm sm:text-base">{ip}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs sm:text-sm">
                            {count} 会话
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <Monitor className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                      <p className="text-sm sm:text-base">暂无活跃会话</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 安全建议 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    安全状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 安全等级评估 */}
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800 text-sm sm:text-base">
                          安全防护已启用
                        </span>
                      </div>
                      <ul className="space-y-1 text-green-700 text-xs sm:text-sm">
                        <li>✓ IP登录限制已启用</li>
                        <li>✓ 暴力破解防护已启用</li>
                        <li>✓ 单设备登录限制已启用</li>
                        <li>✓ 会话超时保护已启用</li>
                      </ul>
                    </div>

                    {/* 安全建议 */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm sm:text-base">安全建议：</h4>
                      <ul className="space-y-1 pl-4 text-gray-600 text-xs sm:text-sm">
                        <li>• 定期监控登录尝试和异常活动</li>
                        <li>• 保持系统和依赖项的最新版本</li>
                        <li>• 定期备份用户数据和系统配置</li>
                        <li>• 为重要操作启用二次验证</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-base text-gray-500 sm:text-lg">无法加载安全统计信息</p>
            <Button onClick={loadSecurityStats} className="mt-4">
              重试
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 