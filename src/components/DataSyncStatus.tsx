'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dataSyncUtils } from '@/lib/services/mockDataService'
import { getStorageInfo } from '@/lib/services/vercelCompat'
import { AlertTriangle, CheckCircle, Database, RefreshCw, Server } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import React from 'react'

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

// 缓存数据库状态，避免频繁请求
let cachedDbStatus: DatabaseStatus | null = null
let lastDbCheck = 0
const DB_CHECK_CACHE_DURATION = 30000 // 30秒缓存

const DataSyncStatus = React.memo(function DataSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isCheckingDB, setIsCheckingDB] = useState(false)

  const checkSyncStatus = useCallback(() => {
    const status = dataSyncUtils.checkSyncStatus()
    setSyncStatus(status)
  }, [])

  const checkDatabaseStatus = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    
    // 使用缓存，除非强制刷新
    if (!forceRefresh && cachedDbStatus && (now - lastDbCheck) < DB_CHECK_CACHE_DURATION) {
      setDatabaseStatus(cachedDbStatus)
      return
    }

    setIsCheckingDB(true)
    try {
      const response = await fetch('/api/health/database')
      const data = await response.json()
      
      let status: DatabaseStatus
      if (response.ok) {
        status = {
          provider: data.database.provider,
          connected: data.database.connected,
          stats: data.database.stats
        }
      } else {
        status = {
          provider: 'Unknown',
          connected: false,
          error: data.database.error
        }
      }
      
      // 更新缓存
      cachedDbStatus = status
      lastDbCheck = now
      setDatabaseStatus(status)
    } catch (error) {
      const status = {
        provider: 'Unknown',
        connected: false,
        error: error instanceof Error ? error.message : '连接失败'
      }
      cachedDbStatus = status
      lastDbCheck = now
      setDatabaseStatus(status)
    } finally {
      setIsCheckingDB(false)
    }
  }, [])

  const handleForceReset = useCallback(async () => {
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
  }, [])

  const handleManualSync = useCallback(() => {
    const success = dataSyncUtils.manualSync()
    if (success) {
      toast.success('同步时间戳已更新')
      checkSyncStatus()
    } else {
      toast.error('手动同步失败')
    }
  }, [checkSyncStatus])

  const handleRefreshDatabase = useCallback(() => {
    checkDatabaseStatus(true) // 强制刷新
  }, [checkDatabaseStatus])

  // 初始化时加载数据
  useEffect(() => {
    checkSyncStatus()
    checkDatabaseStatus()
  }, [checkSyncStatus, checkDatabaseStatus])

  // 减少定时器频率，从30秒改为60秒
  useEffect(() => {
    const interval = setInterval(() => {
      checkSyncStatus()
      checkDatabaseStatus() // 这里会使用缓存
    }, 60000) // 60秒
    return () => clearInterval(interval)
  }, [checkSyncStatus, checkDatabaseStatus])

  const storageInfo = useMemo(() => getStorageInfo(), [])
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshDatabase}
              disabled={isCheckingDB}
              className="ml-auto"
            >
              {isCheckingDB ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
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
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              className="flex-1"
            >
              手动同步
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleForceReset}
              disabled={isResetting}
              className="flex-1"
            >
              {isResetting ? '重置中...' : '重置数据'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 同步状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {syncStatus.synchronized ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            数据同步状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">同步状态:</span>
              <Badge variant={syncStatus.synchronized ? "default" : "secondary"}>
                {syncStatus.synchronized ? "已同步" : "未同步"}
              </Badge>
            </div>
            
            {syncStatus.reason && (
              <div>
                <span className="text-sm font-medium">说明:</span>
                <p className="text-gray-600 text-sm">{syncStatus.reason}</p>
              </div>
            )}
            
            {syncStatus.lastSyncTime && (
              <div>
                <span className="text-sm font-medium">最后同步:</span>
                <p className="text-gray-600 text-sm">{syncStatus.lastSyncTime}</p>
              </div>
            )}
            
            {syncStatus.version && (
              <div>
                <span className="text-sm font-medium">数据版本:</span>
                <p className="text-gray-600 text-sm">{syncStatus.version}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

DataSyncStatus.displayName = 'DataSyncStatus'

export default DataSyncStatus