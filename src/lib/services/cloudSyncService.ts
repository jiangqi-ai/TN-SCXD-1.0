// 云数据同步服务 - 基于JSONBin.io免费API
import type { Product } from '@/types';

// 云存储配置 - 用户需要在前端配置
interface CloudConfig {
  apiKey: string;
  binId: string;
  enabled: boolean;
}

// 默认配置 - 从localStorage获取用户设置
const getCloudConfig = (): CloudConfig => {
  if (typeof window === 'undefined') {
    return { apiKey: '', binId: '', enabled: false };
  }

  try {
    const stored = localStorage.getItem('tn-scxd-cloud-config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load cloud config:', error);
  }

  return { apiKey: '', binId: '', enabled: false };
};

// 保存云配置
const saveCloudConfig = (config: CloudConfig): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tn-scxd-cloud-config', JSON.stringify(config));
};

// JSONBin.io API 调用
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';

// 云数据结构
interface CloudData {
  products: Product[];
  lastUpdated: string;
  version: string;
}

export const cloudSyncService = {
  // 配置云同步
  configureCloudSync: (apiKey: string, binId?: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!apiKey.trim()) {
        reject(new Error('API Key 不能为空'));
        return;
      }

      const config: CloudConfig = {
        apiKey: apiKey.trim(),
        binId: binId?.trim() || '',
        enabled: true
      };

      try {
        saveCloudConfig(config);
        console.log('✅ 云同步配置已保存');
        resolve(true);
      } catch (error) {
        reject(new Error('保存配置失败'));
      }
    });
  },

  // 检查云同步是否已配置
  isCloudSyncEnabled: (): boolean => {
    const config = getCloudConfig();
    return config.enabled && config.apiKey.length > 0;
  },

  // 获取云配置
  getConfig: (): CloudConfig => {
    return getCloudConfig();
  },

  // 禁用云同步
  disableCloudSync: (): void => {
    const config = getCloudConfig();
    config.enabled = false;
    saveCloudConfig(config);
  },

  // 从云端读取数据
  fetchFromCloud: async (): Promise<Product[]> => {
    const config = getCloudConfig();
    
    if (!config.enabled || !config.apiKey) {
      throw new Error('云同步未启用或未配置');
    }

    if (!config.binId) {
      throw new Error('未设置云存储ID，请先上传数据到云端');
    }

    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${config.binId}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': config.apiKey,
          'X-Bin-Meta': 'false'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('云存储数据不存在，请先上传数据');
        } else if (response.status === 401) {
          throw new Error('API Key 无效，请检查配置');
        } else {
          throw new Error(`云端读取失败: ${response.status}`);
        }
      }

      const cloudData: CloudData = await response.json();
      
      // 转换日期字符串为Date对象
      const products = cloudData.products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));

      console.log(`☁️ 从云端获取了 ${products.length} 个产品，更新时间: ${cloudData.lastUpdated}`);
      return products;
    } catch (error) {
      console.error('云端数据获取失败:', error);
      throw error;
    }
  },

  // 上传数据到云端
  uploadToCloud: async (products: Product[]): Promise<void> => {
    const config = getCloudConfig();
    
    if (!config.enabled || !config.apiKey) {
      throw new Error('云同步未启用或未配置');
    }

    const cloudData: CloudData = {
      products: products,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };

    try {
      let response;
      let url = `${JSONBIN_BASE_URL}/b`;
      let method = 'POST';

      // 如果已有binId，使用PUT更新；否则使用POST创建
      if (config.binId) {
        url = `${JSONBIN_BASE_URL}/b/${config.binId}`;
        method = 'PUT';
      }

      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': config.apiKey,
          'X-Bin-Meta': 'false'
        },
        body: JSON.stringify(cloudData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API Key 无效，请检查配置');
        } else {
          throw new Error(`云端上传失败: ${response.status}`);
        }
      }

      const result = await response.json();
      
      // 如果是新创建的bin，保存binId
      if (method === 'POST' && result.metadata?.id) {
        config.binId = result.metadata.id;
        saveCloudConfig(config);
        console.log(`📦 新建云存储ID: ${config.binId}`);
      }

      console.log(`☁️ 成功上传 ${products.length} 个产品到云端`);
    } catch (error) {
      console.error('云端数据上传失败:', error);
      throw error;
    }
  },

  // 同步本地数据到云端
  syncToCloud: async (products: Product[]): Promise<void> => {
    if (!cloudSyncService.isCloudSyncEnabled()) {
      console.log('⚠️ 云同步未启用，跳过同步');
      return;
    }

    try {
      await cloudSyncService.uploadToCloud(products);
      console.log('✅ 数据已同步到云端');
    } catch (error) {
      console.error('❌ 云端同步失败:', error);
      // 不抛出错误，避免影响正常功能
    }
  },

  // 从云端同步数据到本地
  syncFromCloud: async (): Promise<Product[]> => {
    if (!cloudSyncService.isCloudSyncEnabled()) {
      throw new Error('云同步未启用');
    }

    try {
      const cloudProducts = await cloudSyncService.fetchFromCloud();
      console.log('✅ 数据已从云端同步到本地');
      return cloudProducts;
    } catch (error) {
      console.error('❌ 从云端同步失败:', error);
      throw error;
    }
  },

  // 获取云端最后更新时间
  getCloudLastUpdate: async (): Promise<string | null> => {
    if (!cloudSyncService.isCloudSyncEnabled()) {
      return null;
    }

    try {
      const config = getCloudConfig();
      if (!config.binId) return null;

      const response = await fetch(`${JSONBIN_BASE_URL}/b/${config.binId}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': config.apiKey,
          'X-Bin-Meta': 'false'
        }
      });

      if (response.ok) {
        const cloudData: CloudData = await response.json();
        return cloudData.lastUpdated;
      }
    } catch (error) {
      console.error('获取云端更新时间失败:', error);
    }

    return null;
  }
};

// 开发环境下导出到全局对象
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).cloudSync = cloudSyncService;
} 