'use client';

import DataSyncStatus from '@/components/DataSyncStatus';
import DatabaseConfig from '@/components/DatabaseConfig';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { mockAuthService, mockOrderService } from '@/lib/services/mockDataService';
import { exportContractToPDF, generateContractFromOrder } from '@/lib/utils/contractUtils';
import { exportOrdersToExcel, exportOrdersToPDF, generatePrintableOrdersHTML } from '@/lib/utils/exportUtils';
import { formatDate, formatPrice, getOrderStatusColor, getOrderStatusText } from '@/lib/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import type { Contract, CustomerType, Order, Product, User } from '@/types';
import { 
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  FilePlus,
  FileSpreadsheet,
  FileText,
  LogOut,
  MoreHorizontal,
  Package, 
  Plus,
  Printer,
  Settings,
  Shield,
  ShoppingCart, 
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  UserPlus,
  Users 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [productionNotes, setProductionNotes] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    address: ''
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    role: 'customer' as 'admin' | 'customer'
  });
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: ''
  });
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    company: '',
    phone: '',
    role: 'customer' as 'admin' | 'customer'
  });
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [generatingContract, setGeneratingContract] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // 新增状态：合同相关
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contractData, setContractData] = useState<{
    orderId: string;
    terms: string;
    deliveryDate: string;
  }>({
    orderId: '',
    terms: '',
    deliveryDate: ''
  });

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      toast.error('无权访问管理后台');
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        const [ordersData, customersData, allUsersData, productsResponse] = await Promise.all([
          mockOrderService.getAll(),
          mockAuthService.getAllCustomers(),
          mockAuthService.getAllUsers(user.id),
          fetch('/api/products?admin=true'),
        ]);

        if (!productsResponse.ok) {
          throw new Error('获取产品列表失败');
        }

        const productsData = await productsResponse.json();

        setOrders(ordersData);
        setCustomers(customersData);
        setAllUsers(allUsersData);
        setProducts(productsData);

        // 计算统计数据
        const totalRevenue = ordersData
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + order.totalAmount, 0);

        setStats({
          totalOrders: ordersData.length,
          pendingOrders: ordersData.filter(order => order.status === 'pending').length,
          totalCustomers: customersData.length,
          totalRevenue,
        });
      } catch (error) {
        console.error('Failed to load admin data:', error);
        const message = error instanceof Error ? error.message : '加载数据失败';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user, router]);

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await mockOrderService.updateStatus(orderId, status);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      toast.success('订单状态已更新');
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setDeliveryDate(order.deliveryDate?.toISOString().split('T')[0] || '');
    setProductionNotes('');
    if (order.productionNotes) {
      setProductionNotes(order.productionNotes);
    }
    setIsOrderDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('已退出登录');
  };

  const handleExportOrdersExcel = async () => {
    try {
      setIsExporting(true);
      await exportOrdersToExcel(orders);
      toast.success('Excel 文件导出成功');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportOrdersPDF = async () => {
    try {
      setIsExporting(true);
      await exportOrdersToPDF(orders);
      toast.success('PDF 文件导出成功');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateContract = (order: Order) => {
    setContractData({
      orderId: order.id,
      terms: generateContractTermsFromOrder(order),
      deliveryDate: order.deliveryDate?.toISOString().split('T')[0] || ''
    });
    setIsContractDialogOpen(true);
  };

  const generateContractTermsFromOrder = (order: Order): string => {
    const items = order.items.map(item => 
      `${item.productCode} x${item.quantity}件 (${item.selectedDimension}, ${item.selectedColor})`
    ).join('、');

    return `
根据订单 ${order.orderNumber}，双方达成以下协议：

1. 产品内容：${items}
2. 总金额：${formatPrice(order.totalAmount)}
3. 交货地址：${order.customerInfo?.deliveryAddress}
4. 联系人：${order.customerInfo?.name}
5. 联系电话：${order.customerInfo?.contact}

质量标准：
- 产品符合国家相关质量标准
- 表面光滑，无明显瑕疵
- 尺寸误差不超过±2mm

交付条款：
- 货物验收后付款
- 运费由买方承担
- 质量问题7天内可退换
    `.trim();
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      setTogglingProductId(productId);
      
      const response = await fetch(`/api/products/${productId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('更新产品状态失败');
      }
      
      setProducts(products.map(p => p.id === productId ? { ...p, isActive: !currentStatus } : p));
      toast.success(currentStatus ? '产品已禁用' : '产品已启用');
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      toast.error('操作失败，请重试');
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleAddUser = async () => {
    try {
      // 验证表单数据
      if (!newUserData.username || !newUserData.email || !newUserData.password || !newUserData.name) {
        toast.error('请填写所有必填字段');
        return;
      }

      // 创建新用户
      const newUser = await mockAuthService.register({
        username: newUserData.username,
        email: newUserData.email,
        password: newUserData.password,
        name: newUserData.name,
        company: newUserData.company,
        contact: newUserData.phone,
        role: newUserData.role
      });

      // 更新用户列表
      setAllUsers([...allUsers, newUser]);
      
      // 如果是客户，也更新客户列表
      if (newUserData.role === 'customer') {
        setCustomers([...customers, newUser]);
      }

      // 重置表单和关闭对话框
      setNewUserData({
        username: '',
        email: '',
        password: '',
        name: '',
        company: '',
        phone: '',
        role: 'customer'
      });
      setIsAddUserDialogOpen(false);
      
      toast.success('用户添加成功');
    } catch (error) {
      console.error('Failed to add user:', error);
      const errorMessage = error instanceof Error ? error.message : '添加用户失败';
      toast.error(errorMessage);
    }
  };

  const handleEditUser = (userItem: User) => {
    setEditingUser(userItem);
    setUserData({
      name: userItem.name,
      email: userItem.email,
      company: userItem.company || '',
      phone: userItem.phone || '',
      address: userItem.address || ''
    });
    setIsUserDialogOpen(true);
  };

  const handleEditCustomer = (customer: User) => {
    setEditingCustomer(customer);
    setCustomerData({
      name: customer.name,
      email: customer.email,
      company: customer.company || '',
      phone: customer.phone || '',
      address: customer.address || '',
      role: customer.role
    });
    setIsCustomerDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      // 更新用户信息
      const updatedUser = await mockAuthService.updateProfile(editingUser.id, {
        name: userData.name,
        email: userData.email,
        company: userData.company,
        phone: userData.phone,
        address: userData.address
      });

      // 更新用户列表
      setAllUsers(allUsers.map(u => u.id === editingUser.id ? updatedUser : u));
      
      // 如果是客户，也更新客户列表
      if (editingUser.role === 'customer') {
        setCustomers(customers.map(c => c.id === editingUser.id ? updatedUser : c));
      }

      // 重置表单和关闭对话框
      setEditingUser(null);
      setUserData({
        name: '',
        email: '',
        company: '',
        phone: '',
        address: ''
      });
      setIsUserDialogOpen(false);
      
      toast.success('用户信息更新成功');
    } catch (error) {
      console.error('Failed to update user:', error);
      const errorMessage = error instanceof Error ? error.message : '更新用户失败';
      toast.error(errorMessage);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;
    
    try {
      // 更新客户信息
      const updatedCustomer = await mockAuthService.updateProfile(editingCustomer.id, {
        name: customerData.name,
        email: customerData.email,
        company: customerData.company,
        phone: customerData.phone,
        address: customerData.address
      });

      // 更新客户列表
      setCustomers(customers.map(c => c.id === editingCustomer.id ? updatedCustomer : c));
      
      // 也更新用户列表
      setAllUsers(allUsers.map(u => u.id === editingCustomer.id ? updatedCustomer : u));

      // 重置表单和关闭对话框
      setEditingCustomer(null);
      setCustomerData({
        name: '',
        email: '',
        company: '',
        phone: '',
        address: '',
        role: 'customer'
      });
      setIsCustomerDialogOpen(false);
      
      toast.success('客户信息更新成功');
    } catch (error) {
      console.error('Failed to update customer:', error);
      const errorMessage = error instanceof Error ? error.message : '更新客户失败';
      toast.error(errorMessage);
    }
  };

  // 其他处理函数和UI渲染
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-8 h-8 w-48 rounded bg-gray-200" />
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-8 w-1/2 rounded bg-gray-200" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-gray-900">管理后台</h1>
            <p className="text-gray-600">管理产品、订单、用户和系统设置</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>

        {/* 数据库状态 */}
        <div className="mb-6">
          <DataSyncStatus />
        </div>

        {/* 统计卡片 */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-500 p-3">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm font-medium">总订单数</p>
                  <p className="font-bold text-2xl">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-500 p-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm font-medium">待处理订单</p>
                  <p className="font-bold text-2xl">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-green-500 p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm font-medium">客户总数</p>
                  <p className="font-bold text-2xl">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-500 p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm font-medium">总收入</p>
                  <p className="font-bold text-2xl">{formatPrice(stats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容选项卡 */}
        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
            <TabsTrigger value="database">数据库配置</TabsTrigger>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
            <TabsTrigger value="products">产品管理</TabsTrigger>
            <TabsTrigger value="customers">客户管理</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="settings">系统设置</TabsTrigger>
          </TabsList>

          {/* 数据库配置选项卡 */}
          <TabsContent value="database">
            <DatabaseConfig />
          </TabsContent>

          {/* 订单管理选项卡 */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>订单管理</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={handleExportOrdersExcel} disabled={isExporting}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      导出Excel
                    </Button>
                    <Button onClick={handleExportOrdersPDF} disabled={isExporting}>
                      <FileText className="mr-2 h-4 w-4" />
                      导出PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase text-gray-700">
                      <tr>
                        <th className="py-3">订单号</th>
                        <th className="py-3">客户</th>
                        <th className="py-3">金额</th>
                        <th className="py-3">状态</th>
                        <th className="py-3">创建时间</th>
                        <th className="py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-3 font-medium">{order.orderNumber}</td>
                          <td className="py-3">{order.customerInfo.name}</td>
                          <td className="py-3">{formatPrice(order.totalAmount)}</td>
                          <td className="py-3">
                            <Badge variant={getOrderStatusColor(order.status) as any}>
                              {getOrderStatusText(order.status)}
                            </Badge>
                          </td>
                          <td className="py-3">{formatDate(order.createdAt)}</td>
                          <td className="py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'production')}>
                                  <Truck className="mr-2 h-4 w-4" />
                                  开始处理
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'completed')}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  标记完成
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleGenerateContract(order)}>
                                  <FilePlus className="mr-2 h-4 w-4" />
                                  生成合同
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 产品管理选项卡 */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>产品管理</CardTitle>
                  <Link href="/admin/products">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      添加产品
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase text-gray-700">
                      <tr>
                        <th className="py-3">产品编码</th>
                        <th className="py-3">价格</th>
                        <th className="py-3">库存</th>
                        <th className="py-3">状态</th>
                        <th className="py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b">
                          <td className="py-3 font-medium">{product.productCode}</td>
                          <td className="py-3">{formatPrice(product.unitPrice)}</td>
                          <td className="py-3">{product.minimumOrderQty || 0}</td>
                          <td className="py-3">
                            <Badge variant={product.isActive ? 'default' : 'secondary'}>
                              {product.isActive ? '启用' : '禁用'}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/products?edit=${product.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    编辑
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleProductStatus(product.id, product.isActive)}
                                  disabled={togglingProductId === product.id}
                                >
                                  {product.isActive ? (
                                    <>
                                      <Shield className="mr-2 h-4 w-4" />
                                      禁用
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      启用
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 客户管理选项卡 */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>客户管理</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase text-gray-700">
                      <tr>
                        <th className="py-3">姓名</th>
                        <th className="py-3">邮箱</th>
                        <th className="py-3">公司</th>
                        <th className="py-3">电话</th>
                        <th className="py-3">注册时间</th>
                        <th className="py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id} className="border-b">
                          <td className="py-3 font-medium">{customer.name}</td>
                          <td className="py-3">{customer.email}</td>
                          <td className="py-3">{customer.company}</td>
                          <td className="py-3">{customer.phone}</td>
                          <td className="py-3">{formatDate(customer.createdAt)}</td>
                          <td className="py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 用户管理选项卡 */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>用户管理</CardTitle>
                  <Button onClick={() => setIsAddUserDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    添加用户
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase text-gray-700">
                      <tr>
                        <th className="py-3">姓名</th>
                        <th className="py-3">邮箱</th>
                        <th className="py-3">角色</th>
                        <th className="py-3">公司</th>
                        <th className="py-3">注册时间</th>
                        <th className="py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((userItem) => (
                        <tr key={userItem.id} className="border-b">
                          <td className="py-3 font-medium">{userItem.name}</td>
                          <td className="py-3">{userItem.email}</td>
                          <td className="py-3">
                            <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                              {userItem.role === 'admin' ? '管理员' : '客户'}
                            </Badge>
                          </td>
                          <td className="py-3">{userItem.company}</td>
                          <td className="py-3">{formatDate(userItem.createdAt)}</td>
                          <td className="py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(userItem)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  编辑
                                </DropdownMenuItem>
                                {userItem.id !== user?.id && (
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    删除
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统设置选项卡 */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>系统设置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-medium">管理员信息</h3>
                    <p className="mb-4 text-gray-600 text-sm">修改当前管理员账户信息</p>
                    <Button>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑管理员信息
                    </Button>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-medium">数据导出</h3>
                    <p className="mb-4 text-gray-600 text-sm">导出系统数据以进行备份或分析</p>
                    <div className="space-x-2">
                      <Button onClick={handleExportOrdersExcel} disabled={isExporting}>
                        <Download className="mr-2 h-4 w-4" />
                        导出订单数据
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-medium">系统监控</h3>
                    <p className="mb-4 text-gray-600 text-sm">查看系统运行状态和性能指标</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">数据库状态:</span>
                        <span className="ml-2 text-green-600">正常</span>
                      </div>
                      <div>
                        <span className="text-gray-600">系统负载:</span>
                        <span className="ml-2 text-green-600">低</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 添加用户对话框 */}
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加新用户</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名 *</Label>
                  <Input
                    id="username"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="输入用户名"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱 *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="输入邮箱"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="输入密码"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">真实姓名 *</Label>
                <Input
                  id="name"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入真实姓名"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">公司</Label>
                  <Input
                    id="company"
                    value={newUserData.company}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="输入公司名称"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">电话</Label>
                  <Input
                    id="phone"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="输入电话号码"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select value={newUserData.role} onValueChange={(value: 'admin' | 'customer') => setNewUserData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">客户</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAddUser}>
                  添加用户
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 编辑用户对话框 */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑用户信息</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">真实姓名 *</Label>
                <Input
                  id="editName"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入真实姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">邮箱 *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="输入邮箱"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCompany">公司</Label>
                  <Input
                    id="editCompany"
                    value={userData.company}
                    onChange={(e) => setUserData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="输入公司名称"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editPhone">电话</Label>
                  <Input
                    id="editPhone"
                    value={userData.phone}
                    onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="输入电话号码"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editAddress">地址</Label>
                <Textarea
                  id="editAddress"
                  value={userData.address}
                  onChange={(e) => setUserData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="输入地址"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateUser}>
                  保存更改
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 编辑客户对话框 */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑客户信息</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editCustomerName">真实姓名 *</Label>
                <Input
                  id="editCustomerName"
                  value={customerData.name}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入真实姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCustomerEmail">邮箱 *</Label>
                <Input
                  id="editCustomerEmail"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="输入邮箱"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCustomerCompany">公司</Label>
                  <Input
                    id="editCustomerCompany"
                    value={customerData.company}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="输入公司名称"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCustomerPhone">电话</Label>
                  <Input
                    id="editCustomerPhone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="输入电话号码"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCustomerAddress">地址</Label>
                <Textarea
                  id="editCustomerAddress"
                  value={customerData.address}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="输入地址"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateCustomer}>
                  保存更改
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 