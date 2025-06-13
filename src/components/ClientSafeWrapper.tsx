'use client'

import { useEffect, useState } from 'react'

interface ClientSafeWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * 客户端安全包装组件
 * 防止SSR和CSR之间的不匹配问题
 */
export default function ClientSafeWrapper({ 
  children, 
  fallback = null 
}: ClientSafeWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
} 