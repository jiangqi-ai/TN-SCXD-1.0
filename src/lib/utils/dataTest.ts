// 数据测试工具 - 开发环境下调试用
import { mockProductService } from '@/lib/services/mockDataService';
import { securityService } from '@/lib/services/securityService';

export const dataTestUtils = {
  // 检查存储状态
  checkStorageStatus: (): void => {
    console.log('=== 数据存储状态检查 ===');
    
    const products = localStorage.getItem('tn-scxd-products');
    const users = localStorage.getItem('tn-scxd-users');
    const orders = localStorage.getItem('tn-scxd-orders');
    
    console.log('产品数据:', products ? JSON.parse(products).length + ' 条记录' : '无数据');
    console.log('用户数据:', users ? JSON.parse(users).length + ' 条记录' : '无数据');
    console.log('订单数据:', orders ? JSON.parse(orders).length + ' 条记录' : '无数据');
    
    // 安全数据检查
    const loginAttempts = localStorage.getItem('tn-scxd-login-attempts');
    const userSessions = localStorage.getItem('tn-scxd-user-sessions');
    const blockedIPs = localStorage.getItem('tn-scxd-blocked-ips');
    
    console.log('登录尝试:', loginAttempts ? JSON.parse(loginAttempts).length + ' 条记录' : '无数据');
    console.log('用户会话:', userSessions ? JSON.parse(userSessions).length + ' 条记录' : '无数据');
    console.log('被阻止IP:', blockedIPs ? JSON.parse(blockedIPs).length + ' 条记录' : '无数据');
    
    console.log('======================');
  },

  // 模拟用户视图
  simulateUserView: async (): Promise<void> => {
    console.log('=== 模拟用户视图 ===');
    try {
      const products = await mockProductService.getAll();
      console.log('用户可见产品数量:', products.length);
      console.log('用户可见产品列表:');
      products.forEach(p => {
        console.log(`- ${p.productCode}: ${p.isActive ? '激活' : '禁用'}`);
      });
    } catch (error) {
      console.error('获取用户产品失败:', error);
    }
    console.log('==================');
  },

  // 模拟管理员视图
  simulateAdminView: async (): Promise<void> => {
    console.log('=== 模拟管理员视图 ===');
    try {
      const products = await mockProductService.getAllForAdmin();
      console.log('管理员可见产品数量:', products.length);
      console.log('管理员可见产品列表:');
      products.forEach(p => {
        console.log(`- ${p.productCode}: ${p.isActive ? '激活' : '禁用'}`);
      });
    } catch (error) {
      console.error('获取管理员产品失败:', error);
    }
    console.log('=====================');
  },

  // 安全状态检查
  checkSecurityStatus: (): void => {
    console.log('=== 安全状态检查 ===');
    
    const stats = securityService.getSecurityStats();
    console.log('安全统计:', stats);
    
    const sessionStats = securityService.getActiveSessionsStats();
    console.log('会话统计:', sessionStats);
    
    const isBlocked = securityService.isIPBlocked();
    console.log('当前IP是否被阻止:', isBlocked);
    
    if (isBlocked) {
      const remainingTime = securityService.getBlockTimeRemaining();
      console.log('剩余阻止时间:', remainingTime, '分钟');
    }
    
    console.log('==================');
  },

  // 模拟登录失败测试
  simulateLoginFailures: (count: number = 3): void => {
    console.log(`=== 模拟 ${count} 次登录失败 ===`);
    
    for (let i = 0; i < count; i++) {
      securityService.recordLoginAttempt(false);
      console.log(`第 ${i + 1} 次登录失败已记录`);
    }
    
    const isBlocked = securityService.isIPBlocked();
    console.log('IP是否被阻止:', isBlocked);
    
    if (isBlocked) {
      const remainingTime = securityService.getBlockTimeRemaining();
      console.log('阻止剩余时间:', remainingTime, '分钟');
    }
    
    console.log('========================');
  },

  // 分析产品状态
  analyzeProductStatus: async (): Promise<void> => {
    console.log('=== 产品状态分析 ===');
    try {
      const allProducts = await mockProductService.getAllForAdmin();
      const activeProducts = allProducts.filter(p => p.isActive);
      const inactiveProducts = allProducts.filter(p => !p.isActive);
      
      console.log(`总产品数: ${allProducts.length}`);
      console.log(`激活产品: ${activeProducts.length}`);
      console.log(`禁用产品: ${inactiveProducts.length}`);
      
      console.log('\n激活产品详情:');
      activeProducts.forEach(p => {
        console.log(`- ${p.productCode}: 价格 ¥${p.unitPrice}, 创建时间 ${p.createdAt.toLocaleDateString()}`);
      });
      
      if (inactiveProducts.length > 0) {
        console.log('\n禁用产品详情:');
        inactiveProducts.forEach(p => {
          console.log(`- ${p.productCode}: 价格 ¥${p.unitPrice}, 创建时间 ${p.createdAt.toLocaleDateString()}`);
        });
      }
    } catch (error) {
      console.error('分析产品状态失败:', error);
    }
    console.log('==================');
  },

  // 清理所有数据
  clearAllData: (): void => {
    console.log('=== 清理所有数据 ===');
    
    // 清理业务数据
    localStorage.removeItem('tn-scxd-products');
    localStorage.removeItem('tn-scxd-users');
    localStorage.removeItem('tn-scxd-orders');
    
    // 清理安全数据
    securityService.clearAllSecurityData();
    
    // 清理其他数据
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('cart-storage');
    localStorage.removeItem('client-id');
    
    console.log('所有数据已清理完成');
    console.log('==================');
  },

  // 完整测试套件
  runFullTest: async (): Promise<void> => {
    console.log('🚀 开始完整数据测试');
    
    await dataTestUtils.checkStorageStatus();
    await dataTestUtils.checkSecurityStatus();
    await dataTestUtils.analyzeProductStatus();
    await dataTestUtils.simulateUserView();
    await dataTestUtils.simulateAdminView();
    
    console.log('✅ 完整数据测试完成');
  }
};

// 开发环境下导出到全局对象
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).dataTest = dataTestUtils;
  console.log('💡 数据测试工具已加载，使用 dataTest.runFullTest() 运行完整测试');
} 