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

  // 详细检查产品状态
  checkProductStatus: () => {
    if (typeof window === 'undefined') return [];
    
    const products = localStorage.getItem('tn-scxd-products');
    if (!products) {
      console.log('没有产品数据');
      return [];
    }
    
    const data = JSON.parse(products);
    const activeProducts = data.filter((p: any) => p.isActive);
    const inactiveProducts = data.filter((p: any) => !p.isActive);
    
    console.log('=== 产品状态详情 ===');
    console.log('总产品数:', data.length);
    console.log('激活产品数:', activeProducts.length);
    console.log('禁用产品数:', inactiveProducts.length);
    
    console.log('激活的产品:');
    activeProducts.forEach((p: any, index: number) => {
      console.log(`  ${index + 1}. ${p.productCode} (ID: ${p.id})`);
    });
    
    if (inactiveProducts.length > 0) {
      console.log('禁用的产品:');
      inactiveProducts.forEach((p: any, index: number) => {
        console.log(`  ${index + 1}. ${p.productCode} (ID: ${p.id})`);
      });
    }
    
    console.log('=== 产品状态检查完毕 ===');
    return { total: data.length, active: activeProducts, inactive: inactiveProducts };
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
  },

  // 模拟普通用户视图（只看激活产品）
  getUserViewProducts: () => {
    if (typeof window === 'undefined') return [];
    
    const products = localStorage.getItem('tn-scxd-products');
    if (!products) return [];
    
    const data = JSON.parse(products);
    const userViewProducts = data.filter((p: any) => p.isActive);
    
    console.log('=== 普通用户视图 ===');
    console.log('用户可见产品数:', userViewProducts.length);
    userViewProducts.forEach((p: any, index: number) => {
      console.log(`  ${index + 1}. ${p.productCode} - ¥${p.unitPrice}`);
    });
    console.log('=== 用户视图检查完毕 ===');
    
    return userViewProducts;
  },

  // 模拟管理员视图（看所有产品）
  getAdminViewProducts: () => {
    if (typeof window === 'undefined') return [];
    
    const products = localStorage.getItem('tn-scxd-products');
    if (!products) return [];
    
    const data = JSON.parse(products);
    
    console.log('=== 管理员视图 ===');
    console.log('管理员可见产品数:', data.length);
    data.forEach((p: any, index: number) => {
      const status = p.isActive ? '✓ 激活' : '✗ 禁用';
      console.log(`  ${index + 1}. ${p.productCode} - ¥${p.unitPrice} [${status}]`);
    });
    console.log('=== 管理员视图检查完毕 ===');
    
    return data;
  }
};

// 在开发环境下暴露到全局，方便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).dataTest = dataTest;
} 