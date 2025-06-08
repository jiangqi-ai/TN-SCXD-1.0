import type { CustomerType, ProductCategory, ProductSubCategory } from '@/types';

// 产品主分类
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  '攀岩板材',
  '岩点', 
  '五金配件',
  '复合板'
];

// 产品子分类映射
export const PRODUCT_SUB_CATEGORIES: Record<ProductCategory, ProductSubCategory[]> = {
  '攀岩板材': ['高密度攀岩板', '常规攀岩板', '桦木攀岩板', '国产胶合板'],
  '岩点': ['玻璃钢境面', '玻璃钢全砂面', 'PE灌浆点', '桦木造型点', 'PU点'],
  '五金配件': [], // 五金配件暂无子分类
  '复合板': []    // 复合板暂无子分类
};

// 客户类型
export const CUSTOMER_TYPES: CustomerType[] = [
  '未分类',
  'OEM客户',
  '品牌客户',
  '工程客户'
];

// 客户类型描述
export const CUSTOMER_TYPE_DESCRIPTIONS: Record<CustomerType, string> = {
  '未分类': '尚未分类的客户',
  'OEM客户': 'OEM代工客户，通常需要定制化产品',
  '品牌客户': '品牌方客户，有自己的品牌和渠道',
  '工程客户': '工程项目客户，通常为大批量订单'
};

// 产品分类描述
export const PRODUCT_CATEGORY_DESCRIPTIONS: Record<ProductCategory, string> = {
  '攀岩板材': '用于攀岩墙面建设的主要板材',
  '岩点': '攀岩路线上的抓握点',
  '五金配件': '攀岩墙建设所需的五金件',
  '复合板': '多种材料复合制成的特殊板材'
};

// 根据主分类获取子分类
export const getSubCategories = (category: ProductCategory): ProductSubCategory[] => {
  return PRODUCT_SUB_CATEGORIES[category] || [];
};

// 验证分类是否有效
export const isValidCategory = (category: string): category is ProductCategory => {
  return PRODUCT_CATEGORIES.includes(category as ProductCategory);
};

// 验证子分类是否有效
export const isValidSubCategory = (
  category: ProductCategory, 
  subCategory: string
): subCategory is ProductSubCategory => {
  const validSubCategories = PRODUCT_SUB_CATEGORIES[category] || [];
  return validSubCategories.includes(subCategory as ProductSubCategory);
};

// 验证客户类型是否有效
export const isValidCustomerType = (type: string): type is CustomerType => {
  return CUSTOMER_TYPES.includes(type as CustomerType);
};

// 获取产品默认折扣范围
export const getDefaultDiscountRange = (category: ProductCategory): { min: number; max: number } => {
  switch (category) {
    case '攀岩板材':
      return { min: 0, max: 15 }; // 板材可打85折
    case '岩点':
      return { min: 0, max: 20 }; // 岩点可打8折
    case '五金配件':
      return { min: 0, max: 10 }; // 五金配件可打9折
    case '复合板':
      return { min: 0, max: 12 }; // 复合板可打88折
    default:
      return { min: 0, max: 10 };
  }
}; 