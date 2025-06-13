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
							// 全局错误处理，防止第三方脚本错误影响应用
							window.addEventListener('error', function(e) {
								// 如果错误来自浏览器扩展，忽略它
								if (e.filename && (
									e.filename.includes('content.js') ||
									e.filename.includes('extension://') ||
									e.filename.includes('chrome-extension://') ||
									e.filename.includes('moz-extension://')
								)) {
									console.warn('Ignored browser extension error:', e.message);
									e.preventDefault();
									return false;
								}
								
								// 如果是Selection API相关错误，也忽略
								if (e.message && (
									e.message.includes('getRangeAt') || 
									e.message.includes('Selection') ||
									e.message.includes('IndexSizeError') ||
									e.message.includes('range')
								)) {
									console.warn('Ignored Selection API error:', e.message);
									e.preventDefault();
									return false;
								}
							});
							
							// 处理未捕获的Promise rejections
							window.addEventListener('unhandledrejection', function(e) {
								console.warn('Unhandled promise rejection:', e.reason);
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
