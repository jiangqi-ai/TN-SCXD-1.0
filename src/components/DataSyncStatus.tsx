'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dataSyncUtils } from '@/lib/services/mockDataService'
import { getStorageInfo } from '@/lib/services/vercelCompat'
import { AlertTriangle, CheckCircle, Database, RefreshCw, Server } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SyncStatus {
  synchronized: boolean
  reason?: string
  lastSyncTime?: string
  version?: string
}

interface DatabaseStatus {
  provider: string
  connected: boolean
  stats?: {
    users: number
    products: number
  }
  error?: string
}

export default function DataSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isCheckingDB, setIsCheckingDB] = useState(false)

  const checkSyncStatus = () => {
    const status = dataSyncUtils.checkSyncStatus()
    setSyncStatus(status)
  }

  const checkDatabaseStatus = async () => {
    setIsCheckingDB(true)
    try {
      const response = await fetch('/api/health/database')
      const data = await response.json()
      
      if (response.ok) {
        setDatabaseStatus({
          provider: data.database.provider,
          connected: data.database.connected,
          stats: data.database.stats
        })
      } else {
        setDatabaseStatus({
          provider: 'Unknown',
          connected: false,
          error: data.database.error
        })
      }
    } catch (error) {
      setDatabaseStatus({
        provider: 'Unknown',
        connected: false,
        error: error instanceof Error ? error.message : '连接失败'
      })
    } finally {
      setIsCheckingDB(false)
    }
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
    checkDatabaseStatus()
    // 每30秒检查一次状态
    const interval = setInterval(() => {
      checkSyncStatus()
      checkDatabaseStatus()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const storageInfo = getStorageInfo()
  const isUsingDatabase = storageInfo.useDatabase

  if (!syncStatus) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
          <p className="text-gray-500 text-sm">正在检查系统状态...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 数据库状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据库状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isUsingDatabase ? (
                databaseStatus?.connected ? (
                  <>
                    <Server className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-sm">数据库已连接</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-sm">数据库连接失败</span>
                  </>
                )
              ) : (
                <>
                  <Database className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-sm">使用本地存储</span>
                </>
              )}
            </div>
            <Badge variant={
              isUsingDatabase 
                ? (databaseStatus?.connected ? "default" : "destructive")
                : "secondary"
            }>
              {isUsingDatabase 
                ? (databaseStatus?.connected ? "在线" : "离线")
                : "本地"
              }
            </Badge>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">存储方式:</span>{' '}
                <span className="text-gray-600">{storageInfo.reason}</span>
              </div>
              {isUsingDatabase && databaseStatus && (
                <>
                  <div>
                    <span className="font-medium">数据库类型:</span>{' '}
                    <span className="text-gray-600">{databaseStatus.provider}</span>
                  </div>
                  {databaseStatus.stats && (
                    <div>
                      <span className="font-medium">数据统计:</span>{' '}
                      <span className="text-gray-600">
                        用户 {databaseStatus.stats.users} 个，产品 {databaseStatus.stats.products} 个
                      </span>
                    </div>
                  )}
                  {databaseStatus.error && (
                    <div className="rounded border border-red-200 bg-red-50 p-2">
                      <span className="font-medium text-red-800">错误:</span>{' '}
                      <span className="text-red-700">{databaseStatus.error}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={checkDatabaseStatus}
              disabled={isCheckingDB}
              className="text-xs"
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${isCheckingDB ? 'animate-spin' : ''}`} />
              检查连接
            </Button>
          </div>

          {isUsingDatabase && !databaseStatus?.connected && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-amber-800 text-sm">
                <strong>注意:</strong> 数据库连接失败，系统可能无法正常工作。请检查数据库配置。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 数据同步状态（仅在使用本地存储时显示） */}
      {!isUsingDatabase && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              数据同步状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {syncStatus.synchronized ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-sm">数据已同步</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="font-medium text-sm">数据需要同步</span>
                  </>
                )}
              </div>
              <Badge variant={syncStatus.synchronized ? "default" : "destructive"}>
                {syncStatus.synchronized ? "正常" : "异常"}
              </Badge>
            </div>

            {syncStatus.reason && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="text-orange-800 text-sm">
                  <strong>原因:</strong> {syncStatus.reason}
                </p>
              </div>
            )}

            {syncStatus.lastSyncTime && (
              <div className="text-gray-600 text-sm">
                <strong>最后同步:</strong> {syncStatus.lastSyncTime}
              </div>
            )}

            {syncStatus.version && (
              <div className="text-gray-600 text-sm">
                <strong>数据版本:</strong> {syncStatus.version}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={checkSyncStatus}
                className="text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
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
                    <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                    重置中...
                  </>
                ) : (
                  '重置数据'
                )}
              </Button>
            </div>

            {!syncStatus.synchronized && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-blue-800 text-sm">
                  <strong>建议操作:</strong> 如果多个用户报告数据不同步，建议使用"重置数据"功能统一所有数据到最新状态。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 