import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDatabaseStore } from '@/store/useDatabaseStore'
import { useState } from 'react'
import { toast } from 'sonner'

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

  const handleClearConfig = () => {
    clearConfig()
    setFormData({
      databaseUrl: '',
      directUrl: ''
    })
    toast.success('数据库配置已清除，将使用本地存储')
    // 刷新页面以应用更改
    window.location.reload()
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
          <h4 className="font-medium mb-2">当前状态</h4>
          <div className="text-sm text-gray-600">
            <p>存储模式: {isConfigured ? '数据库' : '本地存储'}</p>
            {isConfigured && (
              <p className="mt-1">数据库URL: {databaseUrl ? `${databaseUrl.substring(0, 20)}...` : '未设置'}</p>
            )}
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