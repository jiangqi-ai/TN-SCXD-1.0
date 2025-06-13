// 错误处理工具函数

/**
 * 检查错误是否来自浏览器扩展
 */
export function isBrowserExtensionError(error: Error | ErrorEvent): boolean {
  if ('filename' in error && error.filename) {
    return error.filename.includes('content.js') || 
           error.filename.includes('extension://') ||
           error.filename.includes('chrome-extension://') ||
           error.filename.includes('moz-extension://')
  }
  
  // ErrorEvent没有stack属性，只有Error才有
  if (error instanceof Error && error.stack) {
    return error.stack.includes('content.js') ||
           error.stack.includes('extension://') ||
           error.stack.includes('chrome-extension://') ||
           error.stack.includes('moz-extension://')
  }
  
  return false
}

/**
 * 检查是否是Selection API相关错误
 */
export function isSelectionAPIError(error: Error | ErrorEvent): boolean {
  let message: string
  
  if (error instanceof Error) {
    message = error.message
  } else if ('message' in error && typeof error.message === 'string') {
    message = error.message
  } else {
    message = String(error)
  }
  
  return message.includes('getRangeAt') ||
         message.includes('Selection') ||
         message.includes('IndexSizeError') ||
         message.includes('range')
}

/**
 * 安全的Selection API调用
 */
export function safeGetSelection(): Selection | null {
  try {
    if (typeof window === 'undefined') return null
    
    const selection = window.getSelection()
    if (!selection) return null
    
    // 检查是否有有效的range
    if (selection.rangeCount === 0) return null
    
    return selection
  } catch (error) {
    console.warn('Selection API error:', error)
    return null
  }
}

/**
 * 安全的获取选中文本
 */
export function safeGetSelectedText(): string {
  try {
    const selection = safeGetSelection()
    if (!selection) return ''
    
    return selection.toString()
  } catch (error) {
    console.warn('Failed to get selected text:', error)
    return ''
  }
} 