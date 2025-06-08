'use client';

import CloudSyncConfig from '@/components/CloudSyncConfig';
import DataSyncStatus from '@/components/DataSyncStatus';
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
import { productService } from '@/lib/services/productService';
import { exportContractToPDF, generateContractFromOrder } from '@/lib/utils/contractUtils';
import { exportOrdersToExcel, exportOrdersToPDF, generatePrintableOrdersHTML } from '@/lib/utils/exportUtils';
import { useReactToPrint } from 'react-to-print';
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
import { toast } from 'sonner';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
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
    address: '',
    customerType: '' as '' | CustomerType
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
        const [ordersData, customersData, productsData] = await Promise.all([
          mockOrderService.getAll(),
          mockAuthService.getAllCustomers(),
          productService.getAllForAdmin(),
        ]);

        setOrders(ordersData);
        setCustomers(customersData);
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

  // 导出订单Excel
  const handleExportOrdersExcel = async () => {
    try {
      setIsExporting(true);
      exportOrdersToExcel(orders, {
        format: 'excel',
        includeItems: true,
        includeCustomerInfo: true
      });
      toast.success('订单Excel文件已导出');
    } catch (error) {
      console.error('Export orders Excel failed:', error);
      toast.error('导出订单Excel失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 导出订单PDF
  const handleExportOrdersPDF = async () => {
    try {
      setIsExporting(true);
      await exportOrdersToPDF(orders, {
        format: 'pdf',
        includeItems: true,
        includeCustomerInfo: true
      });
      toast.success('订单PDF文件已导出');
    } catch (error) {
      console.error('Export orders PDF failed:', error);
      toast.error('导出订单PDF失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 打印订单
  const handlePrintOrders = useReactToPrint({
    contentRef: printRef,
    documentTitle: `订单管理_${formatDate(new Date(), 'short')}`,
    print: async (printIframe: HTMLIFrameElement) => {
      const document = printIframe.contentDocument;
      if (document) {
        // 添加自定义样式
        const style = document.createElement('style');
        style.textContent = `
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
        `;
        document.head.appendChild(style);
      }
      // 调用默认打印行为
      printIframe.contentWindow?.print();
    },
  });

  // 生成合同
  const handleGenerateContract = (order: Order) => {
    const defaultDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';
    const deliveryDate: string = order.deliveryDate ? (order.deliveryDate.toISOString().split('T')[0] || '') : defaultDate;
    
    // 根据订单内容自动生成合同条款
    const autoGeneratedTerms = generateContractTermsFromOrder(order);
    
    setContractData({
      orderId: order.id,
      terms: autoGeneratedTerms,
      deliveryDate: deliveryDate
    });
    setIsContractDialogOpen(true);
  };

  // 根据订单内容自动生成合同条款
  const generateContractTermsFromOrder = (order: Order): string => {
    const itemsDetails = order.items.map(item => 
      `- ${item.productCode} (${item.productName || '产品'}) ${item.selectedDimension} ${item.selectedColor} × ${item.quantity}件`
    ).join('\n');

    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalWeight = order.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

    return `
1. 产品详情：
${itemsDetails}
   总数量：${totalQuantity}件
   总重量：约${totalWeight.toFixed(1)}kg

2. 交货条款：
   - 交货方式：送货上门
   - 交货时间：签订合同后15个工作日内
   - 交货地点：${order.customerInfo.deliveryAddress}
   - 收货人：${order.customerInfo.name}
   - 联系电话：${order.customerInfo.contact}

3. 质量标准：
   - 产品符合国家相关质量标准
   - 提供质量检验报告
   - 质保期12个月

4. 付款条款：
   - 付款方式：对账单确认后付款
   - 付款期限：收到货物并验收合格后30天内

5. 特殊要求：
   ${order.customerInfo.specialRequirements || '无特殊要求'}

6. 违约责任：
   - 逾期交货：每延期一天，按合同总价的0.5%支付违约金
   - 质量问题：免费更换或退货

7. 其他条款：
   - 本合同一式两份，双方各执一份
   - 如有争议，通过友好协商解决
   - 合同自双方签字盖章之日起生效
   
8. 生产备注：
   ${order.productionNotes || '无特殊生产要求'}
`;
  };

  // 保存合同
  const handleSaveContract = async () => {
    try {
      setGeneratingContract(contractData.orderId);
      
      const order = orders.find(o => o.id === contractData.orderId);
      if (!order) {
        toast.error('订单不存在');
        return;
      }

      const contract = generateContractFromOrder(order, user!.id, contractData.terms);
      if (contractData.deliveryDate) {
        contract.deliveryDate = new Date(contractData.deliveryDate);
      }

      // 导出合同PDF
      await exportContractToPDF(contract);
      
      toast.success('合同已生成并下载');
      setIsContractDialogOpen(false);
      setContractData({ orderId: '', terms: '', deliveryDate: '' });
    } catch (error) {
      console.error('Generate contract failed:', error);
      toast.error('生成合同失败');
    } finally {
      setGeneratingContract(null);
    }
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
      address: customer.profile.address || '',
      customerType: customer.customerType || ''
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
        },
        customerType: customerData.customerType || undefined
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
    // 验证必填字段
    if (!newUserData.username.trim() || !newUserData.email.trim() || !newUserData.password.trim() || !newUserData.name.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (!user?.id) {
      toast.error('无权限执行此操作');
      return;
    }

    try {
      if (newUserData.role === 'admin') {
        // 创建管理员用户
        await mockAuthService.createAdminUser(user.id, {
          username: newUserData.username,
          email: newUserData.email,
          password: newUserData.password,
          name: newUserData.name,
          company: newUserData.company,
          contact: newUserData.phone
        });
        toast.success('管理员用户创建成功');
      } else {
        // 创建普通客户用户
        await mockAuthService.register({
          username: newUserData.username,
          email: newUserData.email,
          password: newUserData.password,
          name: newUserData.name,
          company: newUserData.company,
          contact: newUserData.phone
        });
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
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建用户失败';
      toast.error(message);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (!user?.id) {
      toast.error('无权限执行此操作');
      return;
    }

    try {
      setDeletingUserId(userId);
      await mockAuthService.deleteUser(user.id, userId);
      
      // 刷新用户列表
      const updatedCustomers = await mockAuthService.getAllCustomers();
      setCustomers(updatedCustomers);
      
      toast.success('用户已删除');
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除用户失败';
      toast.error(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  // 删除客户
  const handleDeleteCustomer = async (customerId: string) => {
    if (!user?.id) {
      toast.error('无权限执行此操作');
      return;
    }

    try {
      setDeletingUserId(customerId);
      await mockAuthService.deleteUser(user.id, customerId);
      
      // 刷新客户列表
      const updatedCustomers = await mockAuthService.getAllCustomers();
      setCustomers(updatedCustomers);
      
      toast.success('客户已删除');
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除客户失败';
      toast.error(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingOrderId(orderId);
      await mockOrderService.delete(orderId);
      // 重新加载订单列表
      const updatedOrders = await mockOrderService.getAll();
      setOrders(updatedOrders);
      toast.success('订单已删除');
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('删除订单失败');
    } finally {
      setDeletingOrderId(null);
    }
  };

  // 切换产品启用/禁用状态
  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      setTogglingProductId(productId);
              const updatedProduct = await productService.update(productId, { isActive: !currentStatus });
      setProducts(products.map(p => p.id === productId ? updatedProduct : p));
      toast.success(currentStatus ? '产品已禁用' : '产品已启用');
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      toast.error('操作失败，请重试');
    } finally {
      setTogglingProductId(null);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-8 h-8 w-48 rounded bg-gray-200"></div>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-8 w-1/2 rounded bg-gray-200"></div>
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
        {/* 返回按钮和退出登录 */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 text-sm">欢迎，{user?.profile.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="mb-4 font-bold text-3xl text-gray-900">管理后台</h1>
          <p className="text-gray-600">
            攀岩墙定制系统管理面板
          </p>
        </div>

        {/* 快速操作卡片 */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link href="/admin/products/edit">
            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="font-medium text-gray-900 text-lg">产品管理</p>
                    <p className="text-gray-600 text-sm">管理产品信息和库存</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/security">
            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="font-medium text-gray-900 text-lg">安全管理</p>
                    <p className="text-gray-600 text-sm">监控登录安全和会话</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => setIsAddUserDialogOpen(true)}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="font-medium text-gray-900 text-lg">添加用户</p>
                  <p className="text-gray-600 text-sm">创建新的系统用户</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 统计卡片 */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="font-medium text-gray-600 text-sm">总订单数</p>
                  <p className="font-bold text-2xl text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="font-medium text-gray-600 text-sm">待处理订单</p>
                  <p className="font-bold text-2xl text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="font-medium text-gray-600 text-sm">客户总数</p>
                  <p className="font-bold text-2xl text-gray-900">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="font-medium text-gray-600 text-sm">总收入</p>
                  <p className="font-bold text-2xl text-gray-900">{formatPrice(stats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 管理选项卡 */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="orders" className="text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">订单管理</TabsTrigger>
            <TabsTrigger value="products" className="text-green-600 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">产品管理</TabsTrigger>
            <TabsTrigger value="customers" className="text-purple-600 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">客户管理</TabsTrigger>
            <TabsTrigger value="users" className="text-orange-600 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">用户管理</TabsTrigger>
            <TabsTrigger value="security" className="text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">安全管理</TabsTrigger>
            <TabsTrigger value="settings" className="text-gray-600 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700">系统设置</TabsTrigger>
          </TabsList>

          {/* 订单管理 */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>订单管理</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintOrders}
                      disabled={orders.length === 0}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      打印订单
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isExporting || orders.length === 0}>
                          {isExporting ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-current border-b-2"></div>
                              导出中...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              导出订单
                              <MoreHorizontal className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportOrdersExcel}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          导出为Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportOrdersPDF}>
                          <FileText className="mr-2 h-4 w-4" />
                          导出为PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(orders || []).slice(0, 10).map(order => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-gray-600 text-sm">
                              {order.customerInfo.name} | {formatDate(order.orderDate, 'short')}
                            </p>
                            {order.confirmedAt && (
                              <p className="text-green-600 text-xs">
                                确认: {formatDate(order.confirmedAt, 'short')}
                              </p>
                            )}
                            {order.productionStartedAt && (
                              <p className="text-blue-600 text-xs">
                                生产: {formatDate(order.productionStartedAt, 'short')}
                              </p>
                            )}
                            {order.completedAt && (
                              <p className="text-green-600 text-xs">
                                完成: {formatDate(order.completedAt, 'short')}
                              </p>
                            )}
                          </div>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {getOrderStatusText(order.status)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-gray-600 text-sm">
                          {(order.items || []).length} 个商品 | {formatPrice(order.totalAmount)} | 对账单确认
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              确认订单
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrder(order)}
                            >
                              <Edit className="mr-1 h-4 w-4" />
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
                              <Package className="mr-1 h-4 w-4" />
                              开始生产
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrder(order)}
                            >
                              <Calendar className="mr-1 h-4 w-4" />
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
                              <Truck className="mr-1 h-4 w-4" />
                              完成订单
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotifyCustomer(order)}
                            >
                              <Bell className="mr-1 h-4 w-4" />
                              通知出货
                            </Button>
                          </>
                        )}
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="mr-1 h-4 w-4" />
                            查看详情
                          </Button>
                        </Link>
                        
                        {/* 生成合同按钮 */}
                        {(order.status === 'confirmed' || order.status === 'production' || order.status === 'completed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateContract(order)}
                            disabled={generatingContract === order.id}
                          >
                            {generatingContract === order.id ? (
                              <>
                                <div className="mr-1 h-4 w-4 animate-spin rounded-full border-current border-b-2"></div>
                                生成中...
                              </>
                            ) : (
                              <>
                                <FilePlus className="mr-1 h-4 w-4" />
                                生成合同
                              </>
                            )}
                          </Button>
                        )}
                        {(order.status === 'pending' || order.status === 'cancelled') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
                        )}
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
                <div className="flex items-center justify-between">
                  <CardTitle>产品管理</CardTitle>
                  <div className="space-x-2">
                    <Link href="/admin/products/upload">
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        批量上传
                      </Button>
                    </Link>
                    <Link href="/admin/products/edit">
                      <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        详细编辑
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(!products || products.length === 0) ? (
                  <div className="py-8 text-center">
                    <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <p className="mb-4 text-gray-600">暂无产品数据</p>
                    <Link href="/admin/products/upload">
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        上传产品
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(products || []).map(product => (
                      <div key={product.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.productCode}
                                className="h-full w-full rounded-lg object-cover"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.productCode}</p>
                            <p className="text-gray-600 text-sm">
                              {product.category} - {product.subCategory}
                            </p>
                            <p className="text-gray-600 text-sm">
                              价格: {formatPrice(product.unitPrice)} | 起订: {product.minimumOrderQty}件
                            </p>
                            <div className="mt-1 flex gap-1">
                              {(product.targetCustomers || []).map(type => (
                                <Badge key={type} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? '启用' : '禁用'}
                          </Badge>
                          <Button
                            variant={product.isActive ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleToggleProductStatus(product.id, product.isActive)}
                            disabled={togglingProductId === product.id}
                          >
                            {togglingProductId === product.id ? (
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-current border-b-2"></div>
                            ) : null}
                            {product.isActive ? '禁用' : '启用'}
                          </Button>
                          <Link href={`/admin/products/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="mr-1 h-4 w-4" />
                              编辑
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 客户管理 */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
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
                    <Plus className="mr-2 h-4 w-4" />
                    添加客户
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(customers || []).map(customer => (
                    <div key={customer.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{customer.profile.name}</p>
                        <p className="text-gray-600 text-sm">
                          {customer.email} | {customer.profile.company || '个人客户'}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-gray-600 text-sm">
                            注册时间: {customer.createdAt ? formatDate(customer.createdAt, 'short') : '未知'}
                          </p>
                          {customer.customerType && (
                            <Badge variant="outline" className="text-xs">
                              {customer.customerType}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                          {customer.isActive ? '活跃' : '禁用'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer)}>
                          <Edit className="mr-1 h-4 w-4" />
                          编辑
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="mr-1 h-4 w-4" />
                              删除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除客户</AlertDialogTitle>
                              <AlertDialogDescription>
                                您确定要删除客户 {customer.profile.name} 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCustomer(customer.id)}
                                disabled={deletingUserId === customer.id}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deletingUserId === customer.id ? '删除中...' : '确认删除'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                <div className="flex items-center justify-between">
                  <CardTitle>用户管理</CardTitle>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => handleEditAdmin()}>
                      <Edit className="mr-2 h-4 w-4" />
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
                      <UserPlus className="mr-2 h-4 w-4" />
                      添加用户
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[user, ...(customers || []).slice(0, 5)]
                    .filter(userItem => userItem && userItem.createdAt) // 过滤掉无效的用户数据
                    .map(userItem => (
                    <div key={userItem.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{userItem.profile.name}</p>
                        <p className="text-gray-600 text-sm">
                          {userItem.email} | {userItem.role === 'admin' ? '管理员' : '普通用户'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          创建时间: {userItem.createdAt ? formatDate(userItem.createdAt, 'short') : '未知'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                          {userItem.role === 'admin' ? '管理员' : '普通用户'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(userItem)}>
                          <Edit className="mr-1 h-4 w-4" />
                          编辑
                        </Button>
                        {userItem.id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="mr-1 h-4 w-4" />
                                删除
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除用户</AlertDialogTitle>
                                <AlertDialogDescription>
                                  您确定要删除用户 {userItem.profile.name} 吗？此操作不可撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  disabled={deletingUserId === userItem.id}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deletingUserId === userItem.id ? '删除中...' : '确认删除'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全管理 */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  安全管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="py-8 text-center">
                    <Shield className="mx-auto mb-4 h-16 w-16 text-red-600" />
                    <h3 className="mb-2 font-medium text-gray-900 text-lg">系统安全监控</h3>
                    <p className="mb-6 text-gray-600">
                      管理登录安全、会话控制和IP访问限制
                    </p>
                    <Link href="/admin/security">
                      <Button size="lg" className="bg-red-600 hover:bg-red-700">
                        <Shield className="mr-2 h-4 w-4" />
                        进入安全管理
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 border-t pt-6 md:grid-cols-3">
                    <div className="rounded-lg bg-red-50 p-4 text-center">
                      <div className="font-bold text-2xl text-red-600">IP限制</div>
                      <div className="mt-1 text-gray-600 text-sm">单IP登录保护</div>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-4 text-center">
                      <div className="font-bold text-2xl text-yellow-600">防暴力破解</div>
                      <div className="mt-1 text-gray-600 text-sm">登录尝试限制</div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <div className="font-bold text-2xl text-green-600">会话管理</div>
                      <div className="mt-1 text-gray-600 text-sm">实时会话监控</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统设置 */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* 云同步配置 */}
              <CloudSyncConfig />
              
              {/* 数据同步状态 */}
              <DataSyncStatus />
              
              <Card>
                <CardHeader>
                  <CardTitle>系统设置</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-4 font-medium text-lg">基本设置</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block font-medium text-sm">系统名称</label>
                          <p className="text-gray-600 text-sm">攀岩墙定制系统</p>
                        </div>
                        <div>
                          <label className="mb-2 block font-medium text-sm">系统版本</label>
                          <p className="text-gray-600 text-sm">v1.0.0</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="mb-4 font-medium text-lg">业务设置</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block font-medium text-sm">运费政策</label>
                          <p className="text-gray-600 text-sm">运费到付</p>
                        </div>
                        <div>
                          <label className="mb-2 block font-medium text-sm">客服信息</label>
                          <p className="text-gray-600 text-sm">13632603365</p>
                          <p className="text-gray-600 text-sm">good-181@163.com</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                <p className="text-gray-600 text-sm">{editingOrder.orderNumber}</p>
              </div>
              
              <div>
                <Label>客户信息</Label>
                <p className="text-gray-600 text-sm">
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
                <h4 className="mb-2 font-medium">修改密码（可选）</h4>
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
                <div>
                  <Label htmlFor="customerType">客户类型</Label>
                  <Select value={customerData.customerType} onValueChange={(value) => setCustomerData({...customerData, customerType: value as CustomerType})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择客户类型" />
                    </SelectTrigger>
                    <SelectContent>
                                                  <SelectItem value="未分类">未分类</SelectItem>
                            <SelectItem value="OEM客户">OEM客户</SelectItem>
                            <SelectItem value="品牌客户">品牌客户</SelectItem>
                            <SelectItem value="工程客户">工程客户</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value as 'admin' | 'customer'})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
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

      {/* 生成合同对话框 */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>生成合同</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractTerms">合同条款</Label>
              <Textarea
                id="contractTerms"
                value={contractData.terms}
                onChange={(e) => setContractData({...contractData, terms: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="contractDeliveryDate">预计交货日期</Label>
              <Input
                id="contractDeliveryDate"
                type="date"
                value={contractData.deliveryDate}
                onChange={(e) => setContractData({...contractData, deliveryDate: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveContract}>
                生成合同
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 隐藏的打印内容 */}
      <div className="hidden">
        <div ref={printRef}>
          <div dangerouslySetInnerHTML={{ 
            __html: generatePrintableOrdersHTML(orders, {
              format: 'pdf',
              includeItems: true,
              includeCustomerInfo: true
            })
          }} />
        </div>
      </div>
    </div>
  );
} 