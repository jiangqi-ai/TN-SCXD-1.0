// 基础数据类型定义

// 客户分类枚举
export type CustomerType = '未分类' | 'OEM客户' | '品牌客户' | '工程客户';

// 产品主分类
export type ProductCategory = '攀岩板材' | '岩点' | '五金配件' | '复合板';

// 产品子分类
export type ProductSubCategory = 
  // 攀岩板材子分类
  | '高密度攀岩板' | '常规攀岩板' | '桦木攀岩板' | '国产胶合板'
  // 岩点子分类
  | '玻璃钢境面' | '玻璃钢全砂面' | 'PE灌浆点' | '桦木造型点' | 'PU点'
  // 五金配件子分类
  | '固定件' | '连接件' | '安全设备';

export interface Product {
  id: string;
  productCode: string;
  image: string;
  availableDimensions: string[];
  weight: number;
  pieceCount: number;
  minimumOrderQty: number;
  availableColors: string[];
  unitPrice: number;
  remarks?: string;
  features?: string[];
  applications?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // 新增字段
  category: ProductCategory;
  subCategory: ProductSubCategory;
  targetCustomers: CustomerType[];
  discountable: boolean; // 是否可打折
  maxDiscount: number; // 最大折扣百分比 (0-100)
}

export interface CartItem {
  productId: string;
  productCode: string;
  selectedDimension: string;
  weight: number;
  pieceCount: number;
  unitPrice: number;
  selectedColor: string;
  quantity: number;
  subtotal: number;
  image: string;
  minimumOrderQty: number;
  // 新增字段
  discount: number; // 折扣百分比 (0-100)
  discountedPrice: number; // 折扣后价格
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'customer';
  name: string;
  company?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // 新增字段
  customerType?: CustomerType; // 仅针对客户用户
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerInfo: {
    name: string;
    company: string;
    contact: string;
    email: string;
    deliveryAddress: string;
    specialRequirements?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'production' | 'completed' | 'cancelled';
  orderDate: Date;
  confirmedAt?: Date;
  productionStartedAt?: Date;
  deliveryDate?: Date;
  completedAt?: Date;
  paymentMethod: 'bill_confirm';
  productionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  // 新增字段
  originalAmount: number; // 原价总金额
  discountAmount: number; // 折扣金额
  approvedBy?: string; // 审核人ID
  approvedAt?: Date; // 审核时间
}

export interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  image: string;
  selectedDimension: string;
  weight: number;
  pieceCount: number;
  selectedColor: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  // 新增字段
  discount: number; // 折扣百分比 (0-100)
  originalPrice: number; // 原价
  discountedPrice: number; // 折扣后价格
  discountable: boolean; // 是否可打折
  maxDiscount: number; // 最大折扣百分比 (0-100)
}

// 合同相关类型
export interface Contract {
  id: string;
  contractNumber: string;
  orderId: string;
  orderNumber: string;
  customerInfo: Order['customerInfo'];
  items: OrderItem[];
  totalAmount: number;
  originalAmount: number;
  discountAmount: number;
  terms: string; // 合同条款
  deliveryDate: Date;
  createdAt: Date;
  createdBy: string; // 创建人ID
  signedAt?: Date;
  isActive: boolean;
}

// Excel导入相关类型
export interface ExcelProductRow {
  '产品编号': string;
  '图片': string;
  '可选尺寸': string;
  '重量': number;
  '包含个数': number;
  '订单数量': number;
  '颜色': string;
  '销售价格（不含运，不含税）': number;
  '备注'?: string;
  '产品分类'?: ProductCategory;
  '产品子分类'?: ProductSubCategory;
  '目标客户'?: string; // 逗号分隔的客户类型
  '最大折扣'?: number;
}

// 表单相关类型
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  company?: string;
  contact: string;
  customerType?: CustomerType;
}

export interface CreateOrderData {
  customerId: string;
  customerInfo: Order['customerInfo'];
  items: OrderItem[];
  totalAmount: number;
  originalAmount: number;
  discountAmount: number;
  status: Order['status'];
}

// 新增：结账请求类型
export interface CreateOrderRequest {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    selectedColor: string;
    unitPrice: number;
    discount: number;
  }[];
  shippingAddress: {
    contactName: string;
    phone: string;
    address: string;
    company?: string;
    notes?: string;
  };
  paymentMethod: 'bill_confirm';
  totalAmount: number;
  originalAmount: number;
  discountAmount: number;
}

// 组件Props类型
export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, color: string, quantity: number) => void;
}

export interface OrderCardProps {
  order: Order;
  onStatusUpdate?: (orderId: string, status: Order['status']) => void;
}

// 状态管理相关类型
export interface FilterState {
  searchTerm: string;
  selectedColors: string[];
  priceRange: [number, number];
  statusFilter: Order['status'] | 'all';
  categoryFilter: ProductCategory | 'all';
  customerTypeFilter: CustomerType | 'all';
}

// 导出相关类型
export interface ExportOptions {
  format: 'excel' | 'pdf';
  includeItems: boolean;
  includeCustomerInfo: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  statusFilter?: Order['status'][];
} 