'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, FileText, Calendar, Eye, ArrowLeft, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store/useAuthStore';
import { mockOrderService } from '@/lib/services/mockDataService';
import { formatPrice, formatDate, getOrderStatusText, getOrderStatusColor } from '@/lib/utils/helpers';
import type { Order } from '@/types';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    const loadOrders = async () => {
      try {
        const data = await mockOrderService.getByCustomer(user.id);
        setOrders(data);
        setFilteredOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
        toast.error('加载订单失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, user, router]);

  // 筛选订单
  useEffect(() => {
    let filtered = orders;

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.productCode.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingOrderId(orderId);
      await mockOrderService.delete(orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast.success('订单已删除');
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('删除订单失败');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              {formatDate(order.orderDate)}
            </p>
          </div>
          <Badge className={getOrderStatusColor(order.status)}>
            {getOrderStatusText(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 订单商品 */}
          <div>
            <h4 className="font-medium mb-2">订单商品:</h4>
            <div className="space-y-2">
              {order.items.slice(0, 2).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.productCode} ({item.selectedColor}) × {item.quantity}
                  </span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-sm text-gray-500">
                  还有 {order.items.length - 2} 个商品...
                </p>
              )}
            </div>
          </div>

          {/* 收货信息 */}
          <div>
            <h4 className="font-medium mb-2">收货信息:</h4>
            <p className="text-sm text-gray-600">
              {order.customerInfo.name} | {order.customerInfo.contact}
            </p>
            <p className="text-sm text-gray-600">
              {order.customerInfo.deliveryAddress}
            </p>
          </div>

          {/* 订单金额和操作 */}
          <div className="flex justify-between items-end pt-4 border-t">
            <div>
              <p className="text-lg font-semibold text-primary">
                总计: {formatPrice(order.totalAmount)}
              </p>
              <p className="text-sm text-gray-500">支付方式: 对账单确认</p>
              {order.deliveryDate && (
                <p className="text-sm text-gray-500">
                  预计交货: {formatDate(order.deliveryDate, 'short')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  查看详情
                </Button>
              </Link>
              {order.status === 'pending' && (
                <>
                  <Button size="sm" variant="destructive">
                    取消订单
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除订单</AlertDialogTitle>
                        <AlertDialogDescription>
                          您确定要删除订单 {order.orderNumber} 吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deletingOrderId === order.id}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deletingOrderId === order.id ? '删除中...' : '确认删除'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">我的订单</h1>
          <p className="text-gray-600">
            管理您的订单，查看订单状态和物流信息
          </p>
        </div>

        {/* 筛选和搜索 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索订单号或商品名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="订单状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待确认</SelectItem>
                    <SelectItem value="confirmed">已确认</SelectItem>
                    <SelectItem value="production">生产中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 订单列表 */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {orders.length === 0 ? (
              <div>
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  还没有订单
                </h3>
                <p className="text-gray-600 mb-6">
                  您还没有下过订单，去产品中心看看吧
                </p>
                <Link href="/products">
                  <Button>
                    <Package className="h-4 w-4 mr-2" />
                    浏览产品
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  没有找到订单
                </h3>
                <p className="text-gray-600 mb-4">
                  没有找到符合条件的订单，试试调整筛选条件
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  清除筛选
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 统计信息 */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{orders.length}</div>
                <div className="text-sm text-gray-600">总订单数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">待确认</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.status === 'production').length}
                </div>
                <div className="text-sm text-gray-600">生产中</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">已完成</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 