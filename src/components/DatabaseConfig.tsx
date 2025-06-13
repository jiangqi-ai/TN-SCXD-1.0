import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDatabaseStore } from '@/store/useDatabaseStore'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

// 数据库连接测试组件
function TestDatabaseConnection() {
  const [testing, setTesting] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<{success: boolean, message: string, mode?: string} | null>(null)
  const { isConfigured } = useDatabaseStore()

  const testConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/health')
      const result = await response.json()
      
      if (result.database?.connected) {
        setLastTestResult({
          success: true, 
          message: '数据库连接正常',
          mode: 'database'
        })
        toast.success('数据库连接测试成功')
      } else if (result.database?.configured === false) {
        setLastTestResult({
          success: true, 
          message: '数据库未配置，使用本地存储模式',
          mode: 'localStorage'
        })
        toast.info('系统使用本地存储模式')
      } else {
        setLastTestResult({
          success: false, 
          message: result.database?.error || '数据库连接失败',
          mode: 'error'
        })
        toast.error('数据库连接测试失败')
      }
    } catch (error) {
      setLastTestResult({
        success: false, 
        message: '连接测试失败',
        mode: 'error'
      })
      toast.error('连接测试失败')
    } finally {
      setTesting(false)
    }
  }

  // 组件加载时自动检测一次
  useEffect(() => {
    testConnection()
  }, [isConfigured])

  return (
    <div className="space-y-2">
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={testConnection}
        disabled={testing}
      >
        {testing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            检测中...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            重新检测
          </>
        )}
      </Button>
      
      {lastTestResult && (
        <div className="space-y-1">
          <div className={`flex items-center text-sm ${lastTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
            {lastTestResult.success ? (
              <CheckCircle className="mr-1 h-4 w-4" />
            ) : (
              <XCircle className="mr-1 h-4 w-4" />
            )}
            {lastTestResult.message}
          </div>
          {lastTestResult.mode && (
            <div className="text-xs text-gray-500">
              当前模式: {lastTestResult.mode === 'database' ? '数据库' : 
                         lastTestResult.mode === 'localStorage' ? '本地存储' : '错误'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DatabaseConfig() {
  const { databaseUrl, directUrl, isConfigured, setDatabaseConfig, clearConfig } = useDatabaseStore()
  const [formData, setFormData] = useState({
    databaseUrl: databaseUrl || '',
    directUrl: directUrl || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // 验证连接字符串格式
      if (!formData.databaseUrl.startsWith('postgresql://') && !formData.databaseUrl.startsWith('postgres://')) {
        throw new Error('数据库连接字符串必须以 postgresql:// 或 postgres:// 开头')
      }

      // 保存配置
      setDatabaseConfig({
        databaseUrl: formData.databaseUrl,
        directUrl: formData.directUrl || formData.databaseUrl
      })

      toast.success('数据库配置已保存')
      
      // 刷新页面以应用新配置
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存配置失败')
    }
  }

  const handleClearConfig = async () => {
    try {
      // 调用API清理配置
      const response = await fetch('/api/config/clear', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        // 本地清理
        clearConfig()
        setFormData({
          databaseUrl: '',
          directUrl: ''
        })
        toast.success('数据库配置已清除，将使用本地存储')
        
        // 短暂延迟后刷新页面以应用更改
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error(result.error || '清理配置失败')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '清理配置失败')
    }
  }

  const handleClearLocalStorage = () => {
    try {
      // 清空所有本地存储数据
      localStorage.removeItem('products')
      localStorage.removeItem('orders')
      localStorage.removeItem('users')
      localStorage.removeItem('contracts')
      
      // 也可以选择清空所有localStorage
      // localStorage.clear()
      
      toast.success('本地存储数据已清除')
      
      // 刷新页面以反映更改
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('清空本地存储失败:', error)
      toast.error('清空本地存储失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据库配置</CardTitle>
        <CardDescription>
          配置 PostgreSQL 数据库连接信息。如未配置，系统将使用本地存储。
          {isConfigured && (
            <span className="text-green-600 ml-2">
              ✓ 已配置
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="databaseUrl">主数据库连接 URL</Label>
            <Input
              id="databaseUrl"
              placeholder="postgresql://username:password@host:port/database"
              value={formData.databaseUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, databaseUrl: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="directUrl">直接连接 URL（可选）</Label>
            <Input
              id="directUrl"
              placeholder="postgresql://username:password@host:port/database"
              value={formData.directUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, directUrl: e.target.value }))}
            />
            <p className="text-sm text-gray-500">
              如果不填写，将使用主数据库连接 URL
            </p>
          </div>

          <div className="flex space-x-2">
            <Button type="submit">
              {isConfigured ? '更新配置' : '保存配置'}
            </Button>
            
            {isConfigured && (
              <Button type="button" variant="outline" onClick={handleClearConfig}>
                清除配置
              </Button>
            )}
          </div>
        </form>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">连接状态检测</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>存储模式: {isConfigured ? '数据库' : '本地存储'}</p>
            {isConfigured && (
              <p>数据库URL: {databaseUrl ? `${databaseUrl.substring(0, 20)}...` : '未设置'}</p>
            )}
            <div className="mt-2">
              <TestDatabaseConnection />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">数据管理</h4>
          <div className="space-y-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                >
                  清空本地存储数据
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认清空本地存储</AlertDialogTitle>
                  <AlertDialogDescription>
                    这将永久删除所有本地存储的数据，包括：
                    <ul className="mt-2 list-disc list-inside">
                      <li>产品数据</li>
                      <li>订单数据</li>
                      <li>用户数据</li>
                      <li>合同数据</li>
                    </ul>
                    此操作无法撤销，确认继续吗？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearLocalStorage}>
                    确认清空
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-sm text-gray-500">
              点击上方按钮将删除所有本地存储数据
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 