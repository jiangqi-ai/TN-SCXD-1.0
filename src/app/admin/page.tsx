'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Settings,
  FileText,
  Upload,
  Edit,
  ArrowLeft,
  LogOut,
  Plus,
  UserPlus,
  Calendar,
  CheckCircle,
  Truck,
  Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockOrderService, mockAuthService } from '@/lib/services/mockDataService';
import { formatPrice, formatDate, getOrderStatusText, getOrderStatusColor } from '@/lib/utils/helpers';
import type { Order, User } from '@/types';
import { toast } from 'sonner';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    confirmPassword: ''
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
    address: ''
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

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      toast.error('无权访问管理后台');
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        const [ordersData, customersData] = await Promise.all([
          mockOrderService.getAll(),
          mockAuthService.getAllCustomers(),
        ]);

        setOrders(ordersData);
        setCustomers(customersData);

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
        toast.error('加载数据失败');
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

  const handleSaveOrderChanges = async () => {
    if (!editingOrder) return;

    try {
      if (deliveryDate) {
        await mockOrderService.setDeliveryDate(editingOrder.id, new Date(deliveryDate));
      }
      if (productionNotes) {
        await mockOrderService.addProductionNotes(editingOrder.id, productionNotes);
      }
      
      // 刷新订单列表
      const updatedOrders = await mockOrderService.getAll();
      setOrders(updatedOrders);
      
      setIsOrderDialogOpen(false);
      setEditingOrder(null);
      toast.success('订单信息已更新');
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleNotifyCustomer = (order: Order) => {
    // 模拟通知客户
    toast.success(`已通知客户 ${order.customerInfo.name}，订单 ${order.orderNumber} 已出货`);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('已退出登录');
  };

  const handleEditAdmin = () => {
    if (user) {
      setEditingAdmin(user);
      setAdminData({
        name: user.profile.name,
        email: user.email,
        company: user.profile.company || '',
        phone: user.profile.phone || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsAdminDialogOpen(true);
    }
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin) return;

    // 验证密码
    if (adminData.newPassword && adminData.newPassword !== adminData.confirmPassword) {
      toast.error('新密码与确认密码不一致');
      return;
    }

    try {
      const updateData: Partial<User> = {
        email: adminData.email,
        profile: {
          name: adminData.name,
          company: adminData.company,
          phone: adminData.phone
        }
      };

      if (adminData.newPassword) {
        updateData.password = adminData.newPassword;
      }

      await mockAuthService.updateProfile(editingAdmin.id, updateData);
      setIsAdminDialogOpen(false);
      setEditingAdmin(null);
      toast.success('账户信息已更新');
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleEditCustomer = (customer: User) => {
    setEditingCustomer(customer);
    setCustomerData({
      name: customer.profile.name,
      email: customer.email,
      company: customer.profile.company || '',
      phone: customer.profile.phone || '',
      address: customer.profile.address || ''
    });
    setIsCustomerDialogOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const updateData: Partial<User> = {
        email: customerData.email,
        profile: {
          name: customerData.name,
          company: customerData.company,
          phone: customerData.phone,
          address: customerData.address
        }
      };

      await mockAuthService.updateProfile(editingCustomer.id, updateData);
      
      // 刷新客户列表
      const updatedCustomers = await mockAuthService.getAllCustomers();
      setCustomers(updatedCustomers);
      
      setIsCustomerDialogOpen(false);
      setEditingCustomer(null);
      toast.success('客户信息已更新');
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleEditUser = (userItem: User) => {
    if (userItem.id === user?.id) {
      handleEditAdmin();
      return;
    }
    
    setEditingUser(userItem);
    setUserData({
      name: userItem.profile.name,
      email: userItem.email,
      company: userItem.profile.company || '',
      phone: userItem.profile.phone || '',
      address: userItem.profile.address || ''
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const updateData: Partial<User> = {
        email: userData.email,
        profile: {
          name: userData.name,
          company: userData.company,
          phone: userData.phone,
          address: userData.address
        }
      };

      await mockAuthService.updateProfile(editingUser.id, updateData);
      
      // 刷新用户列表
      const [updatedCustomers] = await Promise.all([
        mockAuthService.getAllCustomers()
      ]);
      setCustomers(updatedCustomers);
      
      setIsUserDialogOpen(false);
      setEditingUser(null);
      toast.success('用户信息已更新');
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleAddUser = async () => {
    try {
      await mockAuthService.register({
        username: newUserData.username,
        email: newUserData.email,
        password: newUserData.password,
        name: newUserData.name,
        company: newUserData.company,
        contact: newUserData.phone
      });

      // 如果是管理员，需要手动更新角色
      if (newUserData.role === 'admin') {
        // 这里应该有专门的API来设置管理员，暂时直接在mock数据中处理
        toast.success('管理员用户创建成功');
      } else {
        toast.success('用户创建成功');
      }

      // 刷新用户列表
      const updatedCustomers = await mockAuthService.getAllCustomers();
      setCustomers(updatedCustomers);
      
      setIsAddUserDialogOpen(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        name: '',
        company: '',
        phone: '',
        role: 'customer'
      });
    } catch (error: any) {
      toast.error(error.message || '创建用户失败');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮和退出登录 */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">欢迎，{user?.profile.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">管理后台</h1>
          <p className="text-gray-600">
            攀岩墙定制系统管理面板
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总订单数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">待处理订单</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">客户总数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总收入</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 管理选项卡 */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
            <TabsTrigger value="products">产品管理</TabsTrigger>
            <TabsTrigger value="customers">客户管理</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="settings">系统设置</TabsTrigger>
          </TabsList>

          {/* 订单管理 */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>订单管理</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 10).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">
                              {order.customerInfo.name} | {formatDate(order.orderDate, 'short')}
                            </p>
                            {order.confirmedAt && (
                              <p className="text-xs text-green-600">
                                确认: {formatDate(order.confirmedAt, 'short')}
                              </p>
                            )}
                            {order.productionStartedAt && (
                              <p className="text-xs text-blue-600">
                                生产: {formatDate(order.productionStartedAt, 'short')}
                              </p>
                            )}
                            {order.completedAt && (
                              <p className="text-xs text-green-600">
                                完成: {formatDate(order.completedAt, 'short')}
                              </p>
                            )}
                          </div>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {getOrderStatusText(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {order.items.length} 个商品 | {formatPrice(order.totalAmount)} | 对账单确认
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              确认订单
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrder(order)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              编辑订单
                            </Button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'production')}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              开始生产
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrder(order)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              回复交期
                            </Button>
                          </>
                        )}
                        {order.status === 'production' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              完成订单
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotifyCustomer(order)}
                            >
                              <Bell className="h-4 w-4 mr-1" />
                              通知出货
                            </Button>
                          </>
                        )}
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            查看详情
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 产品管理 */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>产品管理</CardTitle>
                  <div className="space-x-2">
                    <Link href="/admin/products/upload">
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        批量上传
                      </Button>
                    </Link>
                    <Link href="/admin/products/edit">
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        编辑产品
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">产品管理功能</p>
                  <div className="space-x-2">
                    <Link href="/admin/products/upload">
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Excel批量上传
                      </Button>
                    </Link>
                    <Link href="/admin/products/edit">
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        编辑现有产品
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 客户管理 */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>客户管理</CardTitle>
                  <Button onClick={() => {
                    setNewUserData({
                      username: '',
                      email: '',
                      password: '',
                      name: '',
                      company: '',
                      phone: '',
                      role: 'customer'
                    });
                    setIsAddUserDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加客户
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers.map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{customer.profile.name}</p>
                        <p className="text-sm text-gray-600">
                          {customer.email} | {customer.profile.company || '个人客户'}
                        </p>
                        <p className="text-sm text-gray-600">
                          注册时间: {customer.createdAt ? formatDate(customer.createdAt, 'short') : '未知'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                          {customer.isActive ? '活跃' : '禁用'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer)}>
                          <Edit className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 用户管理 */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>用户管理</CardTitle>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => handleEditAdmin()}>
                      <Edit className="h-4 w-4 mr-2" />
                      编辑我的账户
                    </Button>
                    <Button onClick={() => {
                      setNewUserData({
                        username: '',
                        email: '',
                        password: '',
                        name: '',
                        company: '',
                        phone: '',
                        role: 'admin'
                      });
                      setIsAddUserDialogOpen(true);
                    }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      添加用户
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[user, ...customers.slice(0, 5)]
                    .filter(userItem => userItem && userItem.createdAt) // 过滤掉无效的用户数据
                    .map(userItem => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{userItem.profile.name}</p>
                        <p className="text-sm text-gray-600">
                          {userItem.email} | {userItem.role === 'admin' ? '管理员' : '普通用户'}
                        </p>
                        <p className="text-sm text-gray-600">
                          创建时间: {userItem.createdAt ? formatDate(userItem.createdAt, 'short') : '未知'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                          {userItem.role === 'admin' ? '管理员' : '普通用户'}
                        </Badge>
                        {userItem.id === user?.id ? (
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(userItem)}>
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(userItem)}>
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统设置 */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>系统设置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">基本设置</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">系统名称</label>
                        <p className="text-sm text-gray-600">攀岩墙定制系统</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">系统版本</label>
                        <p className="text-sm text-gray-600">v1.0.0</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">业务设置</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">免运费金额</label>
                        <p className="text-sm text-gray-600">所有订单免运费</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">客服信息</label>
                        <p className="text-sm text-gray-600">400-123-4567</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 订单编辑对话框 */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑订单</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div>
                <Label>订单号</Label>
                <p className="text-sm text-gray-600">{editingOrder.orderNumber}</p>
              </div>
              
              <div>
                <Label>客户信息</Label>
                <p className="text-sm text-gray-600">
                  {editingOrder.customerInfo.name} | {editingOrder.customerInfo.contact}
                </p>
              </div>

              <div>
                <Label htmlFor="deliveryDate">预计交货日期</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="productionNotes">生产备注</Label>
                <Textarea
                  id="productionNotes"
                  placeholder="请输入生产备注..."
                  value={productionNotes}
                  onChange={(e) => setProductionNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveOrderChanges}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 管理员编辑对话框 */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑管理员账户</DialogTitle>
          </DialogHeader>
          {editingAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminName">姓名</Label>
                  <Input
                    id="adminName"
                    value={adminData.name}
                    onChange={(e) => setAdminData({...adminData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">邮箱</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminCompany">公司</Label>
                  <Input
                    id="adminCompany"
                    value={adminData.company}
                    onChange={(e) => setAdminData({...adminData, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="adminPhone">电话</Label>
                  <Input
                    id="adminPhone"
                    value={adminData.phone}
                    onChange={(e) => setAdminData({...adminData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">修改密码（可选）</h4>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="oldPassword">当前密码</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      value={adminData.oldPassword}
                      onChange={(e) => setAdminData({...adminData, oldPassword: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">新密码</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={adminData.newPassword}
                      onChange={(e) => setAdminData({...adminData, newPassword: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={adminData.confirmPassword}
                      onChange={(e) => setAdminData({...adminData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveAdmin}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 客户编辑对话框 */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑客户信息</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">姓名</Label>
                  <Input
                    id="customerName"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">邮箱</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerCompany">公司</Label>
                  <Input
                    id="customerCompany"
                    value={customerData.company}
                    onChange={(e) => setCustomerData({...customerData, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">电话</Label>
                  <Input
                    id="customerPhone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerAddress">地址</Label>
                  <Input
                    id="customerAddress"
                    value={customerData.address}
                    onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveCustomer}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 用户编辑对话框 */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户信息</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userName">姓名</Label>
                  <Input
                    id="userName"
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail">邮箱</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userCompany">公司</Label>
                  <Input
                    id="userCompany"
                    value={userData.company}
                    onChange={(e) => setUserData({...userData, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="userPhone">电话</Label>
                  <Input
                    id="userPhone"
                    value={userData.phone}
                    onChange={(e) => setUserData({...userData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userAddress">地址</Label>
                  <Input
                    id="userAddress"
                    value={userData.address}
                    onChange={(e) => setUserData({...userData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveUser}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 添加用户对话框 */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newUserName">用户名</Label>
              <Input
                id="newUserName"
                value={newUserData.username}
                onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newUserEmail">邮箱</Label>
              <Input
                id="newUserEmail"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newUserPassword">密码</Label>
              <Input
                id="newUserPassword"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newUserName">姓名</Label>
              <Input
                id="newUserName"
                value={newUserData.name}
                onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newUserCompany">公司</Label>
              <Input
                id="newUserCompany"
                value={newUserData.company}
                onChange={(e) => setNewUserData({...newUserData, company: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newUserPhone">电话</Label>
              <Input
                id="newUserPhone"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newUserRole">角色</Label>
              <select
                id="newUserRole"
                value={newUserData.role}
                onChange={(e) => setNewUserData({...newUserData, role: e.target.value as 'admin' | 'customer'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="customer">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddUser}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 