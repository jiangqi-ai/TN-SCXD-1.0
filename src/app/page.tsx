'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, User, Package, FileText, ArrowLeft, ArrowRight, Star, CheckCircle, Users, Truck } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { mockProductService } from '@/lib/services/mockDataService'
import { formatPrice } from '@/lib/utils/helpers'
import type { Product } from '@/types'
import Navigation from '@/components/Navigation'

// 开发环境下导入数据测试工具
if (process.env.NODE_ENV === 'development') {
	import('@/lib/utils/dataTest').then((module) => {
		if (typeof window !== 'undefined') {
			(window as any).dataTest = module.dataTest;
		}
	});
}

/**
 * @description 这只是个示例页面，你可以随意修改这个页面或进行全面重构
 */
export default function HomePage() {
	const { user, isAuthenticated } = useAuthStore()
	const { getTotalItems } = useCartStore()
	const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const loadFeaturedProducts = async () => {
			try {
				const products = await mockProductService.getAll()
				// 取前4个产品作为特色产品
				setFeaturedProducts(products.slice(0, 4))
			} catch (error) {
				console.error('Failed to load featured products:', error)
			} finally {
				setIsLoading(false)
			}
		}

		loadFeaturedProducts()
	}, [])

	const ProductCard = ({ product }: { product: Product }) => (
		<Card className="hover:shadow-lg transition-shadow">
			<CardHeader className="pb-3">
				<div className="aspect-square relative bg-gray-100 rounded-lg mb-3">
					{product.image ? (
						<img
							src={product.image}
							alt={product.productCode}
							className="w-full h-full object-cover rounded-lg"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400">
							<Package className="h-12 w-12" />
						</div>
					)}
				</div>
				<CardTitle className="text-lg">{product.productCode}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2 text-sm text-gray-600">
					<p>尺寸: {product.availableDimensions.join(', ')}</p>
					<p>重量: {product.weight}kg</p>
					<p>包含: {product.pieceCount}个</p>
					<div className="flex flex-wrap gap-1 mt-2">
						{product.availableColors.map(color => (
							<Badge key={color} variant="secondary" className="text-xs">
								{color}
							</Badge>
						))}
					</div>
				</div>
				<div className="mt-4 pt-4 border-t">
					<div className="flex justify-between items-center">
						<div>
							<p className="text-lg font-bold text-primary">
								{formatPrice(product.unitPrice)}
							</p>
							<p className="text-xs text-gray-500">
								起订: {product.minimumOrderQty}件
							</p>
						</div>
						<Link href={`/products/${product.id}`}>
							<Button size="sm">查看详情</Button>
						</Link>
					</div>
				</div>
			</CardContent>
		</Card>
	)

	return (
		<div className="min-h-screen bg-gray-50">
			{/* 导航栏 */}
			<Navigation />

			{/* 主要内容 */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* 欢迎区域 */}
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						专业攀岩定制服务
					</h2>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						提供高质量的攀岩板材定制服务，支持多重规格和颜色选择，满足您的个性化订单需求
					</p>
				</div>

				{/* 功能特色 */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
					<Card>
						<CardContent className="p-6 text-center">
							<Package className="h-12 w-12 text-primary mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">多种规格</h3>
							<p className="text-gray-600">提供多种尺寸和规格选择，满足不同的订单需求</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6 text-center">
							<ShoppingCart className="h-12 w-12 text-primary mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">在线下单</h3>
							<p className="text-gray-600">便捷的在线下单系统，实时跟踪订单状态</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6 text-center">
							<FileText className="h-12 w-12 text-primary mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">快速生产</h3>
							<p className="text-gray-600">专业生产线，确保产品质量和交货时间</p>
						</CardContent>
					</Card>
				</div>

				{/* 热门产品 */}
				<section>
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-2xl font-bold text-gray-900">热门产品</h3>
						<Link href="/products">
							<Button variant="outline">查看全部</Button>
						</Link>
					</div>
					
					{isLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{[...Array(4)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardHeader>
										<div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
										<div className="h-4 bg-gray-200 rounded"></div>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="h-3 bg-gray-200 rounded"></div>
											<div className="h-3 bg-gray-200 rounded"></div>
											<div className="h-3 bg-gray-200 rounded w-2/3"></div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{featuredProducts.map(product => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>
					)}
				</section>

				{/* 如果未登录，显示登录提示 */}
				{!isAuthenticated && (
					<div className="mt-12 text-center">
						<Card className="max-w-md mx-auto">
							<CardContent className="p-6">
								<h4 className="text-lg font-semibold mb-2">开始您的定制之旅</h4>
								<p className="text-gray-600 mb-4">
									登录后即可浏览完整产品目录并进行在线下单
								</p>
								<div className="text-center">
									<Link href="/login">
										<Button>立即登录</Button>
									</Link>
									<p className="mt-3 text-sm text-gray-500">
										如需注册账户，请联系管理员
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</main>

			{/* 页脚 */}
			<footer className="bg-gray-900 text-white mt-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="text-center">
						<p className="text-gray-400">
							© 2025 攀岩墙定制系统. 专业攀岩配套解决方案供应商.
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
