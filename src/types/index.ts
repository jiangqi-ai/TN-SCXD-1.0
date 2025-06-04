// 基础数据类型定义
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
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'customer';
  profile: {
    name: string;
    company?: string;
    phone?: string;
    address?: string;
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
}

export interface CreateOrderData {
  customerId: string;
  customerInfo: Order['customerInfo'];
  items: OrderItem[];
  totalAmount: number;
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
} 