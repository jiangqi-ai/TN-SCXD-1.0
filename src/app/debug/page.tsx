'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
  const [config, setConfig] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config/clear')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('获取配置失败:', error)
    }
  }

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error('获取健康状态失败:', error)
    }
  }

  const clearConfig = async () => {
    if (!confirm('确定要清理数据库配置吗？')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/config/clear', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        alert('配置已清理')
        fetchConfig()
        fetchHealth()
      } else {
        alert('清理失败: ' + data.error)
      }
    } catch (error) {
      alert('清理失败: ' + error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
    fetchHealth()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">调试信息</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>数据库配置</CardTitle>
            <CardDescription>当前数据库配置状态</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
            <Button 
              onClick={fetchConfig}
              className="mt-4 mr-2"
              variant="outline"
            >
              刷新配置
            </Button>
            <Button 
              onClick={clearConfig}
              disabled={loading}
              variant="destructive"
            >
              {loading ? '清理中...' : '清理配置'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>健康检查</CardTitle>
            <CardDescription>系统健康状态</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
            <Button 
              onClick={fetchHealth}
              className="mt-4"
              variant="outline"
            >
              刷新状态
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>问题排查</CardTitle>
          <CardDescription>常见问题及解决方案</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border p-4 rounded">
            <h3 className="font-medium">1. 数据库连接字符串格式错误</h3>
            <p className="text-sm text-gray-600 mt-1">
              错误信息：invalid port number in database URL
            </p>
            <p className="text-sm mt-2">
              解决方案：确保数据库URL格式正确，例如：
              <code className="bg-gray-100 px-1 rounded">
                postgresql://user:password@host:5432/database
              </code>
            </p>
          </div>
          
          <div className="border p-4 rounded">
            <h3 className="font-medium">2. 浏览器扩展错误</h3>
            <p className="text-sm text-gray-600 mt-1">
              错误信息：content.js, autoinsert.js, rtvt openBall
            </p>
            <p className="text-sm mt-2">
              解决方案：这些错误来自浏览器扩展，已被自动过滤，不影响应用功能
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 