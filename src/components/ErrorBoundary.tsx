'use client'

import React from 'react'
import { isBrowserExtensionError, isSelectionAPIError } from '@/lib/utils/errorHandler'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 使用工具函数检查是否是Selection API相关错误
    if (isSelectionAPIError(error)) {
      console.warn('Caught Selection API error, ignoring:', error.message)
      return { hasError: false } // 忽略这类错误
    }
    
    // 检查是否是浏览器扩展错误
    if (isBrowserExtensionError(error)) {
      console.warn('Caught browser extension error, ignoring:', error.message)
      return { hasError: false } // 忽略这类错误
    }
    
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 使用工具函数检查是否是第三方脚本错误
    if (isBrowserExtensionError(error) || isSelectionAPIError(error)) {
      console.warn('Caught third-party script error, ignoring:', error.message)
      return
    }
    
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
            <div className="text-center">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                出现了一些问题
              </h2>
              <p className="mb-6 text-gray-600">
                页面遇到了意外错误，请刷新页面重试。
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 