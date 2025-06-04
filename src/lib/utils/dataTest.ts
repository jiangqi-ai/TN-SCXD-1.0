// 数据持久化测试工具
export const dataTest = {
  // 检查localStorage中的所有数据
  checkStorage: () => {
    if (typeof window === 'undefined') {
      console.log('服务器端环境，无法访问localStorage');
      return;
    }

    console.log('=== localStorage 数据检查 ===');
    
    // 检查产品数据
    const products = localStorage.getItem('tn-scxd-products');
    console.log('产品数据:', products ? JSON.parse(products).length + ' 个产品' : '无数据');
    
    // 检查用户数据
    const users = localStorage.getItem('tn-scxd-users');
    console.log('用户数据:', users ? JSON.parse(users).length + ' 个用户' : '无数据');
    
    // 检查订单数据
    const orders = localStorage.getItem('tn-scxd-orders');
    console.log('订单数据:', orders ? JSON.parse(orders).length + ' 个订单' : '无数据');
    
    console.log('=== 数据检查完毕 ===');
  },

  // 清空所有数据
  clearAllData: () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('tn-scxd-products');
    localStorage.removeItem('tn-scxd-users');
    localStorage.removeItem('tn-scxd-orders');
    
    console.log('所有localStorage数据已清空');
  },

  // 检查特定产品
  checkProducts: () => {
    if (typeof window === 'undefined') return [];
    
    const products = localStorage.getItem('tn-scxd-products');
    if (products) {
      const data = JSON.parse(products);
      console.log('产品列表:', data.map((p: any) => p.productCode));
      return data;
    }
    return [];
  }
};

// 在开发环境下暴露到全局，方便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).dataTest = dataTest;
} 