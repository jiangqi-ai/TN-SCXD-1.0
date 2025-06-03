import "@/styles/globals.css";

import type { Metadata } from "next";
import { Toaster } from "sonner";

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
			<body className="font-sans antialiased">
				{children}
				<Toaster position="top-center" richColors />
			</body>
		</html>
	);
}
