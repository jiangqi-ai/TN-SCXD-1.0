'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Monitor, 
  Clock,
  Ban,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockAuthService } from '@/lib/services/mockDataService';
import { securityService } from '@/lib/services/securityService';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 页面标题 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                安全管理
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
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
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button 
                onClick={handleClearSecurityData}
                variant="destructive"
                size="sm"
                className="text-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                清理数据
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* 安全统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* 被阻止的IP */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    <span className="text-sm sm:text-base">被阻止IP</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-red-600">
                    {stats.blockedIPs}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    当前被阻止的IP地址数量
                  </p>
                </CardContent>
              </Card>

              {/* 活跃登录尝试 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    <span className="text-sm sm:text-base">登录尝试</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                    {stats.activeAttempts}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    近期活跃的登录尝试
                  </p>
                </CardContent>
              </Card>

              {/* 活跃会话 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span className="text-sm sm:text-base">活跃会话</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">
                    {stats.activeSessions}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    当前在线用户数量
                  </p>
                </CardContent>
              </Card>

              {/* 设备分布 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="text-sm sm:text-base">设备数量</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {Object.keys(stats.sessionStats.sessionsByIP).length}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    不同IP设备数量
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 详细信息 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
                        <div key={ip} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm sm:text-base font-mono">{ip}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs sm:text-sm">
                            {count} 会话
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Monitor className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm sm:text-base font-medium text-green-800">
                          安全防护已启用
                        </span>
                      </div>
                      <ul className="text-xs sm:text-sm text-green-700 space-y-1">
                        <li>✓ IP登录限制已启用</li>
                        <li>✓ 暴力破解防护已启用</li>
                        <li>✓ 单设备登录限制已启用</li>
                        <li>✓ 会话超时保护已启用</li>
                      </ul>
                    </div>

                    {/* 安全建议 */}
                    <div className="space-y-2">
                      <h4 className="text-sm sm:text-base font-medium">安全建议：</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 pl-4">
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
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">无法加载安全统计信息</p>
            <Button onClick={loadSecurityStats} className="mt-4">
              重试
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 