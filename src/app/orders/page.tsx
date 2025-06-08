'use client';

import Navigation from '@/components/Navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockOrderService } from '@/lib/services/mockDataService';
import { exportOrdersToExcel, exportOrdersToPDF, generatePrintableOrdersHTML } from '@/lib/utils/exportUtils';
import { formatDate, formatPrice, getOrderStatusColor, getOrderStatusText } from '@/lib/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import type { Order } from '@/types';
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Eye, 
  FileSpreadsheet, 
  FileText, 
  MoreHorizontal,
  Package, 
  Printer,
  Search, 
  Trash2 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  // 导出Excel
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      exportOrdersToExcel(filteredOrders, {
        format: 'excel',
        includeItems: true,
        includeCustomerInfo: true
      });
      toast.success('Excel文件已导出');
    } catch (error) {
      console.error('Export Excel failed:', error);
      toast.error('导出Excel失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 导出PDF
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportOrdersToPDF(filteredOrders, {
        format: 'pdf',
        includeItems: true,
        includeCustomerInfo: true
      });
      toast.success('PDF文件已导出');
    } catch (error) {
      console.error('Export PDF failed:', error);
      toast.error('导出PDF失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 打印配置
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `订单列表_${formatDate(new Date(), 'short')}`,
    print: async (printIframe: HTMLIFrameElement) => {
      const document = printIframe.contentDocument;
      if (document) {
        // 添加自定义样式
        const style = document.createElement('style');
        style.textContent = `
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
        `;
        document.head.appendChild(style);
      }
      // 调用默认打印行为
      printIframe.contentWindow?.print();
    },
  });

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
            <p className="mt-1 text-gray-600 text-sm">
              <Calendar className="mr-1 inline h-4 w-4" />
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
            <h4 className="mb-2 font-medium">订单商品:</h4>
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
                <p className="text-gray-500 text-sm">
                  还有 {order.items.length - 2} 个商品...
                </p>
              )}
            </div>
          </div>

          {/* 收货信息 */}
          <div>
            <h4 className="mb-2 font-medium">收货信息:</h4>
            <p className="text-gray-600 text-sm">
              {order.customerInfo.name} | {order.customerInfo.contact}
            </p>
            <p className="text-gray-600 text-sm">
              {order.customerInfo.deliveryAddress}
            </p>
          </div>

          {/* 订单金额和操作 */}
          <div className="flex items-end justify-between border-t pt-4">
            <div>
              <p className="font-semibold text-lg text-primary">
                总计: {formatPrice(order.totalAmount)}
              </p>
              <p className="text-gray-500 text-sm">支付方式: 对账单确认</p>
              {order.deliveryDate && (
                <p className="text-gray-500 text-sm">
                  预计交货: {formatDate(order.deliveryDate, 'short')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="mr-1 h-4 w-4" />
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
                        <Trash2 className="mr-1 h-4 w-4" />
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-4 font-bold text-3xl text-gray-900">我的订单</h1>
          <p className="text-gray-600">
            管理您的订单，查看订单状态和物流信息
          </p>
        </div>

        {/* 筛选和搜索 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
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
              
              {/* 导出功能 */}
              {filteredOrders.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    disabled={isExporting}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    打印
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isExporting}>
                        {isExporting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-current border-b-2" />
                            导出中...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            导出
                            <MoreHorizontal className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportExcel}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        导出为Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <FileText className="mr-2 h-4 w-4" />
                        导出为PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 隐藏的打印内容 */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            <div dangerouslySetInnerHTML={{ 
              __html: generatePrintableOrdersHTML(filteredOrders, {
                format: 'pdf',
                includeItems: true,
                includeCustomerInfo: true
              })
            }} />
          </div>
        </div>

        {/* 订单列表 */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="mb-2 h-6 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 rounded bg-gray-200" />
                    <div className="h-4 w-5/6 rounded bg-gray-200" />
                    <div className="h-4 w-4/6 rounded bg-gray-200" />
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
          <div className="py-12 text-center">
            {orders.length === 0 ? (
              <div>
                <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                  还没有订单
                </h3>
                <p className="mb-6 text-gray-600">
                  您还没有下过订单，去产品中心看看吧
                </p>
                <Link href="/products">
                  <Button>
                    <Package className="mr-2 h-4 w-4" />
                    浏览产品
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                  没有找到订单
                </h3>
                <p className="mb-4 text-gray-600">
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
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="font-bold text-2xl text-primary">{orders.length}</div>
                <div className="text-gray-600 text-sm">总订单数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="font-bold text-2xl text-yellow-600">
                  {orders.filter(o => o.status === 'pending').length}
                </div>
                <div className="text-gray-600 text-sm">待确认</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="font-bold text-2xl text-blue-600">
                  {orders.filter(o => o.status === 'production').length}
                </div>
                <div className="text-gray-600 text-sm">生产中</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="font-bold text-2xl text-green-600">
                  {orders.filter(o => o.status === 'completed').length}
                </div>
                <div className="text-gray-600 text-sm">已完成</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 