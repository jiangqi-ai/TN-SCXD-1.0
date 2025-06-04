'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, User, MapPin, CreditCard, Calendar, Truck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockOrderService } from '@/lib/services/mockDataService';
import { formatPrice, formatDate, getOrderStatusText, getOrderStatusColor } from '@/lib/utils/helpers';
import type { Order } from '@/types';
import { toast } from 'sonner';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const resolvedParams = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    const loadOrder = async () => {
      try {
        const data = await mockOrderService.getById(resolvedParams.id);
        if (data) {
          // 检查订单是否属于当前用户（安全检查）
          if (data.customerId !== user.id && user.role !== 'admin') {
            toast.error('无权访问此订单');
            router.push('/orders');
            return;
          }
          setOrder(data);
        } else {
          toast.error('订单不存在');
          router.push('/orders');
        }
      } catch (error) {
        console.error('Failed to load order:', error);
        toast.error('加载订单失败');
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [resolvedParams.id, isAuthenticated, user, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">订单不存在</h2>
          <p className="text-gray-600 mb-6">
            抱歉，您要查看的订单不存在或已被删除
          </p>
          <Link href="/orders">
            <Button>返回订单列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回订单列表
            </Button>
          </Link>
        </div>

        {/* 订单标题 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                订单详情
              </h1>
              <p className="text-gray-600">订单号: {order.orderNumber}</p>
            </div>
            <Badge className={`${getOrderStatusColor(order.status)} text-lg px-4 py-2`}>
              {getOrderStatusText(order.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：订单详情 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 订单商品 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  订单商品
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="aspect-square w-16 bg-gray-100 rounded flex items-center justify-center">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.productName}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{item.productCode}</h3>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          <p>规格: {item.selectedDimension}</p>
                          <p>重量: {item.weight}kg | 包含: {item.pieceCount}个</p>
                          <p>颜色: <span className="font-medium">{item.selectedColor}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.unitPrice)}</p>
                        <p className="text-sm text-gray-600">× {item.quantity}</p>
                        <p className="font-semibold text-primary mt-1">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 收货信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  收货信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium">{order.customerInfo.name}</span>
                    <span className="text-gray-600 ml-2">{order.customerInfo.contact}</span>
                  </div>
                  {order.customerInfo.company && (
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{order.customerInfo.company}</span>
                    </div>
                  )}
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <span className="text-gray-600">{order.customerInfo.deliveryAddress}</span>
                  </div>
                  {order.customerInfo.specialRequirements && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-1">特殊要求:</p>
                      <p className="text-sm text-gray-600">{order.customerInfo.specialRequirements}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 生产备注（如果有） */}
            {order.productionNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    生产备注
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{order.productionNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：订单信息 */}
          <div className="space-y-6">
            {/* 订单摘要 */}
            <Card>
              <CardHeader>
                <CardTitle>订单摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>商品总额</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>运费</span>
                    <span>到付</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>税费</span>
                    <span>—</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>总计</span>
                    <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 订单状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  订单状态
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium">下单时间</p>
                      <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                    </div>
                  </div>
                  
                  {order.confirmedAt && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium">订单确认时间</p>
                        <p className="text-sm text-gray-600">{formatDate(order.confirmedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.productionStartedAt && (
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium">生产开始时间</p>
                        <p className="text-sm text-gray-600">{formatDate(order.productionStartedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.deliveryDate && (
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-orange-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium">预计交货时间</p>
                        <p className="text-sm text-gray-600">{formatDate(order.deliveryDate)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.completedAt && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium">完成时间</p>
                        <p className="text-sm text-gray-600">{formatDate(order.completedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium">支付方式</p>
                      <p className="text-sm text-gray-600">对账单确认</p>
                    </div>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="pt-4 border-t">
                    <Button variant="destructive" className="w-full">
                      取消订单
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 联系客服 */}
            <Card>
              <CardHeader>
                <CardTitle>需要帮助？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  如有任何问题，请联系我们的客服团队
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>客服电话:</strong> 13632603365</p>
                  <p><strong>客服邮箱:</strong> good-181@163.com</p>
                  <p><strong>服务时间:</strong> 9:00-18:00</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 