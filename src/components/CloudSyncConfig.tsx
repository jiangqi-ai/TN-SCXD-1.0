'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Cloud, CloudOff, Key, Upload, Download, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'
import { cloudSyncService } from '@/lib/services/cloudSyncService'
import { productService } from '@/lib/services/productService'
import { toast } from 'sonner'

export default function CloudSyncConfig() {
  const [config, setConfig] = useState({
    apiKey: '',
    binId: '',
    enabled: false
  })
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [cloudLastUpdate, setCloudLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    const currentConfig = cloudSyncService.getConfig()
    setConfig(currentConfig)
    
    // 获取云端最后更新时间
    if (currentConfig.enabled) {
      cloudSyncService.getCloudLastUpdate().then(setCloudLastUpdate)
    }
  }, [])

  const handleSaveConfig = async () => {
    if (!config.apiKey.trim()) {
      toast.error('请输入API Key')
      return
    }

    setIsConfiguring(true)
    try {
      await cloudSyncService.configureCloudSync(config.apiKey, config.binId)
      toast.success('云同步配置已保存')
      
      // 重新获取配置（可能包含新的binId）
      const updatedConfig = cloudSyncService.getConfig()
      setConfig(updatedConfig)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '配置失败')
    } finally {
      setIsConfiguring(false)
    }
  }

  const handleDisableSync = () => {
    cloudSyncService.disableCloudSync()
    setConfig(prev => ({ ...prev, enabled: false }))
    toast.success('云同步已禁用')
  }

  const handleUploadToCloud = async () => {
    setIsUploading(true)
    try {
      const products = await productService.getAllForAdmin()
      await cloudSyncService.uploadToCloud(products)
      toast.success(`成功上传 ${products.length} 个产品到云端`)
      
      // 更新最后更新时间
      const lastUpdate = await cloudSyncService.getCloudLastUpdate()
      setCloudLastUpdate(lastUpdate)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadFromCloud = async () => {
    setIsDownloading(true)
    try {
      const cloudProducts = await cloudSyncService.syncFromCloud()
      toast.success(`成功从云端获取 ${cloudProducts.length} 个产品`)
      
      // 刷新页面以显示最新数据
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '下载失败')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {config.enabled ? (
            <Cloud className="h-5 w-5 text-blue-500" />
          ) : (
            <CloudOff className="h-5 w-5 text-gray-400" />
          )}
          云同步配置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 状态显示 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">云同步状态</span>
            <Badge variant={config.enabled ? "default" : "secondary"}>
              {config.enabled ? '已启用' : '未启用'}
            </Badge>
          </div>
          {config.enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisableSync}
              className="text-xs"
            >
              禁用同步
            </Button>
          )}
        </div>

        {/* API Key 配置 */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              JSONBin.io API Key
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="apiKey"
                type="password"
                placeholder="请输入您的JSONBin.io API Key"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              />
              <Button
                onClick={handleSaveConfig}
                disabled={isConfiguring}
                size="sm"
              >
                {isConfiguring ? '保存中...' : '保存'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              获取免费API Key: 
              <a 
                href="https://jsonbin.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline ml-1"
              >
                jsonbin.io
                <ExternalLink className="h-3 w-3 inline ml-1" />
              </a>
            </p>
          </div>

          {config.binId && (
            <div>
              <Label>云存储ID</Label>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {config.binId}
              </div>
            </div>
          )}
        </div>

        {/* 云端信息 */}
        {config.enabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">云端状态</h4>
            <div className="space-y-2 text-sm text-blue-700">
              {cloudLastUpdate ? (
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  最后更新: {new Date(cloudLastUpdate).toLocaleString()}
                </p>
              ) : (
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  云端暂无数据
                </p>
              )}
            </div>
          </div>
        )}

        {/* 同步操作 */}
        {config.enabled && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadToCloud}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    上传到云端
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadFromCloud}
                disabled={isDownloading}
                className="flex-1"
              >
                {isDownloading ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-pulse" />
                    下载中...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    从云端下载
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>说明:</strong> 管理员修改产品后会自动同步到云端，客户端会在加载时自动获取最新数据。
                手动操作仅在特殊情况下使用。
              </p>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        {!config.enabled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">如何启用云同步</h4>
            <ol className="text-xs text-gray-600 space-y-1">
              <li>1. 访问 <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">jsonbin.io</a> 注册免费账户</li>
              <li>2. 获取 API Key（免费额度足够使用）</li>
              <li>3. 在上方输入框填入 API Key 并保存</li>
              <li>4. 点击"上传到云端"初始化云存储</li>
              <li>5. 之后所有产品修改将自动同步到云端</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 