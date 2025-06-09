'use client';

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
import DatabaseConfig from '@/components/DatabaseConfig'

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // 新增：所有用户列表（包括管理员）
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
          mockAuthService.getAllUsers(user.id), // 获取所有用户（包括管理员）
          fetch('/api/products?admin=true'),
        ]);

        if (!productsResponse.ok) {
          throw new Error('获取产品列表失败');
        }

        const productsData = await productsResponse.json();

        setOrders(ordersData);
        setCustomers(customersData);
        setAllUsers(allUsersData); // 设置所有用户数据
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
    if (!user) return;
    setEditingAdmin(user);
    setAdminData({
      name: user.name,
      email: user.email,
      company: user.company || '',
      phone: user.phone || '',
      address: user.address || '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsAdminDialogOpen(true);
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
        name: adminData.name,
        company: adminData.company,
        phone: adminData.phone,
        address: adminData.address
      };

      if (adminData.newPassword) {
        updateData.password = adminData.newPassword;
      }

      await mockAuthService.updateProfile(editingAdmin.id, updateData);
      
      // 刷新用户信息
      const updatedUsers = await mockAuthService.getAllUsers(editingAdmin.id);
      if (updatedUsers.length > 0) {
        const currentUser = updatedUsers.find(u => u.id === editingAdmin.id);
        if (currentUser) {
          useAuthStore.setState({ user: currentUser });
        }
      }
      
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
      name: customer.name,
      email: customer.email,
      company: customer.company || '',
      phone: customer.phone || '',
      address: customer.address || '',
      role: customer.role || 'customer'
    });
    setIsCustomerDialogOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const updateData: Partial<User> = {
        email: customerData.email,
        name: customerData.name,
        company: customerData.company,
        phone: customerData.phone,
        address: customerData.address,
        role: customerData.role
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
      name: userItem.name,
      email: userItem.email,
      company: userItem.company || '',
      phone: userItem.phone || '',
      address: userItem.address || ''
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const updateData: Partial<User> = {
        email: userData.email,
        name: userData.name,
        company: userData.company,
        phone: userData.phone,
        address: userData.address
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
      const [updatedCustomers, updatedAllUsers] = await Promise.all([
        mockAuthService.getAllCustomers(),
        mockAuthService.getAllUsers(user.id)
      ]);
      setCustomers(updatedCustomers);
      setAllUsers(updatedAllUsers);
      
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
      const [updatedCustomers, updatedAllUsers] = await Promise.all([
        mockAuthService.getAllCustomers(),
        mockAuthService.getAllUsers(user.id)
      ]);
      setCustomers(updatedCustomers);
      setAllUsers(updatedAllUsers);
      
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">管理后台</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          退出登录
        </Button>
      </div>

      <div className="mb-8">
        <DatabaseConfig />
      </div>

      <div className="mb-8">
        <DataSyncStatus />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-2">系统状态</h3>
            <p className="text-sm text-gray-500">
              {isAuthenticated ? '已连接' : '未连接'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 