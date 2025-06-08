import type { Order } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 价格格式化
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(price);
};

// 日期格式化
export const formatDate = (date: Date | null | undefined, format: 'full' | 'short' | 'time' = 'full'): string => {
  // 处理空值和无效日期
  if (!date) return '未知';
  
  // 确保是Date对象并且是有效的
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) return '无效日期';
  
  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' }
  };
  
  try {
    return new Intl.DateTimeFormat('zh-CN', optionsMap[format]).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '格式错误';
  }
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
};

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 生成订单号
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `HZTN${timestamp.slice(-8)}${random}`;
};

// 邮箱验证
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 手机号验证
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 订单状态文本
export const getOrderStatusText = (status: Order['status']): string => {
  const statusMap = {
    pending: '待确认',
    confirmed: '已确认',
    production: '生产中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status];
};

// 订单状态颜色
export const getOrderStatusColor = (status: Order['status']): string => {
  const colorMap = {
    pending: 'text-yellow-600 bg-yellow-100',
    confirmed: 'text-blue-600 bg-blue-100',
    production: 'text-purple-600 bg-purple-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100'
  };
  return colorMap[status];
};

// 计算总重量
export const calculateTotalWeight = (items: { weight: number; quantity: number }[]): number => {
  return items.reduce((total, item) => total + (item.weight * item.quantity), 0);
};

// 颜色字符串解析
export const parseColors = (colorString: string): string[] => {
  if (!colorString) return [];
  return colorString.split(',').map(color => color.trim()).filter(Boolean);
};

// 数字验证
export const validateNumber = (value: any, fieldName: string, rowIndex?: number): number => {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    const position = rowIndex !== undefined ? `第 ${rowIndex + 2} 行` : '';
    throw new Error(`${position}${fieldName}必须是有效的正数`);
  }
  return num;
};

// 产品编号验证
export const validateProductCode = (code: string, rowIndex?: number): string => {
  if (!code || code.trim() === '') {
    const position = rowIndex !== undefined ? `第 ${rowIndex + 2} 行` : '';
    throw new Error(`${position}产品编号不能为空`);
  }
  return code.trim();
}; 