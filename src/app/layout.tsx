import "@/styles/globals.css";

import type { Metadata } from "next";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
	title: "攀岩墙定制系统",
	description: "专业的攀岩墙定制解决方案",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="zh-CN">
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							// 增强的全局错误处理，防止第三方脚本错误影响应用
							function shouldIgnoreError(error) {
								const errorStr = typeof error === 'string' ? error : 
								                 error.message ? error.message + (error.stack || '') :
								                 error.filename ? error.filename + (error.message || '') : String(error);
								
								// 浏览器扩展错误模式
								const extensionPatterns = [
									'content.js',
									'autoinsert.js',
									'extension://',
									'chrome-extension://',
									'moz-extension://',
									'rtvt openBall',
									'isDragging has already been declared',
									'Failed to execute \\'getRangeAt\\' on \\'Selection\\'',
									'IndexSizeError',
									'VM', // Chrome DevTools虚拟脚本
									'rtvt'
								];
								
								// DOM弃用警告
								const deprecationPatterns = [
									'DOMSubtreeModified',
									'DOMNodeInserted', 
									'DOMNodeRemoved',
									'deprecated'
								];
								
								return extensionPatterns.some(pattern => errorStr.includes(pattern)) ||
								       deprecationPatterns.some(pattern => errorStr.includes(pattern));
							}
							
							window.addEventListener('error', function(e) {
								if (shouldIgnoreError(e)) {
									console.warn('Ignored extension/deprecated error:', e.message);
									e.preventDefault();
									return false;
								}
								
								// 记录真实的应用错误
								console.error('Application error:', {
									message: e.message,
									filename: e.filename,
									lineno: e.lineno,
									colno: e.colno,
									error: e.error
								});
							});
							
							// 处理未捕获的Promise rejections
							window.addEventListener('unhandledrejection', function(e) {
								if (shouldIgnoreError(String(e.reason))) {
									console.warn('Ignored extension promise rejection:', e.reason);
									e.preventDefault();
									return false;
								}
								console.error('Unhandled promise rejection:', e.reason);
							});
						`,
					}}
				/>
			</head>
			<body className="font-sans antialiased">
				<ErrorBoundary>
					{children}
				</ErrorBoundary>
				<Toaster position="top-center" richColors />
			</body>
		</html>
	);
}
