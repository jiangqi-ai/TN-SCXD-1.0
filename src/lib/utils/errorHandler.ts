// 错误处理工具函数

/**
 * 检查错误是否来自浏览器扩展
 */
export function isBrowserExtensionError(error: Error | ErrorEvent | string): boolean {
  const errorStr = typeof error === 'string' ? error : 
                   error instanceof Error ? error.message + (error.stack || '') :
                   'filename' in error ? error.filename + error.message : String(error)
  
  // 检查常见的浏览器扩展错误模式
  const extensionPatterns = [
    'content.js',
    'autoinsert.js',
    'extension://',
    'chrome-extension://',
    'moz-extension://',
    'rtvt openBall',
    'isDragging has already been declared',
    'Failed to execute \'getRangeAt\' on \'Selection\'',
    'IndexSizeError'
  ]
  
  return extensionPatterns.some(pattern => errorStr.includes(pattern))
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
 * 检查是否是DOM Mutation Event弃用警告
 */
export function isDOMDeprecationWarning(error: Error | ErrorEvent | string): boolean {
  const errorStr = typeof error === 'string' ? error : 
                   error instanceof Error ? error.message :
                   'message' in error ? error.message : String(error)
  
  return errorStr.includes('DOMSubtreeModified') ||
         errorStr.includes('DOMNodeInserted') ||
         errorStr.includes('DOMNodeRemoved') ||
         errorStr.includes('deprecated')
}

/**
 * 检查是否应该忽略的错误
 */
export function shouldIgnoreError(error: Error | ErrorEvent | string): boolean {
  return isBrowserExtensionError(error) || 
         isDOMDeprecationWarning(error) ||
         (typeof error === 'string' && error.includes('rtvt'))
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
    // 不记录Selection API错误，因为这些通常来自扩展
    if (!isBrowserExtensionError(error as Error)) {
      console.warn('Selection API error:', error)
    }
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
    if (!isBrowserExtensionError(error as Error)) {
      console.warn('Failed to get selected text:', error)
    }
    return ''
  }
} 