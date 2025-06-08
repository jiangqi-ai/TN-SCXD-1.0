'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react'
import { dataSyncUtils } from '@/lib/services/mockDataService'
import { toast } from 'sonner'

interface SyncStatus {
  synchronized: boolean
  reason?: string
  lastSyncTime?: string
  version?: string
}

export default function DataSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  const checkSyncStatus = () => {
    const status = dataSyncUtils.checkSyncStatus()
    setSyncStatus(status)
  }

  const handleForceReset = async () => {
    setIsResetting(true)
    try {
      const success = dataSyncUtils.forceResetAllData()
      if (success) {
        toast.success('数据重置成功，页面将自动刷新')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error('数据重置失败')
      }
    } catch (error) {
      console.error('Reset error:', error)
      toast.error('数据重置时出现错误')
    } finally {
      setIsResetting(false)
    }
  }

  const handleManualSync = () => {
    const success = dataSyncUtils.manualSync()
    if (success) {
      toast.success('同步时间戳已更新')
      checkSyncStatus()
    } else {
      toast.error('手动同步失败')
    }
  }

  useEffect(() => {
    checkSyncStatus()
    // 每30秒检查一次状态
    const interval = setInterval(checkSyncStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!syncStatus) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">正在检查数据同步状态...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          数据同步状态
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {syncStatus.synchronized ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">数据已同步</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">数据需要同步</span>
              </>
            )}
          </div>
          <Badge variant={syncStatus.synchronized ? "default" : "destructive"}>
            {syncStatus.synchronized ? "正常" : "异常"}
          </Badge>
        </div>

        {syncStatus.reason && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>原因:</strong> {syncStatus.reason}
            </p>
          </div>
        )}

        {syncStatus.lastSyncTime && (
          <div className="text-sm text-gray-600">
            <strong>最后同步:</strong> {syncStatus.lastSyncTime}
          </div>
        )}

        {syncStatus.version && (
          <div className="text-sm text-gray-600">
            <strong>数据版本:</strong> {syncStatus.version}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={checkSyncStatus}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            检查状态
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            className="text-xs"
          >
            手动同步
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={handleForceReset}
            disabled={isResetting}
            className="text-xs"
          >
            {isResetting ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                重置中...
              </>
            ) : (
              '重置数据'
            )}
          </Button>
        </div>

        {!syncStatus.synchronized && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>建议操作:</strong> 如果多个用户报告数据不同步，建议使用"重置数据"功能统一所有数据到最新状态。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 