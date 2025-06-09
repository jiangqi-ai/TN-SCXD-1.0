'use client'

import Navigation from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { productService } from '@/lib/services/hybridProductService'
import { formatPrice } from '@/lib/utils/helpers'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import type { Product } from '@/types'
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Package, ShoppingCart, Star, Truck, User, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// 生产环境下移除调试工具

/**
 * @description 这只是个示例页面，你可以随意修改这个页面或进行全面重构
 */
export default function HomePage() {
	const { user, isAuthenticated } = useAuthStore()
	const { getTotalItems } = useCartStore()
	const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isMounted, setIsMounted] = useState(false)
	const [products, setProducts] = useState<Product[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		setIsMounted(true)
	}, [])

	useEffect(() => {
		const loadProducts = async () => {
			try {
				const products = await productService.getAll()
				setProducts(products)
			} catch (error) {
				console.error('Failed to load products:', error)
				toast.error('加载产品失败')
			} finally {
				setLoading(false)
			}
		}

		if (isMounted) {
			loadProducts()
		}
	}, [isMounted])

	useEffect(() => {
		if (!isMounted) return

		const loadFeaturedProducts = async () => {
			try {
				// 取前4个产品作为特色产品
				setFeaturedProducts(products.slice(0, 4))
				
				// 如果没有产品数据，提示联系管理员
				if (products.length === 0) {
					console.log('💡 暂无产品数据，请联系管理员上传产品或配置云端同步');
				}
			} catch (error) {
				console.error('Failed to load featured products:', error)
			} finally {
				setIsLoading(false)
			}
		}

		loadFeaturedProducts()
	}, [isMounted, products])

	const ProductCard = ({ product }: { product: Product }) => (
		<Card className="transition-shadow hover:shadow-lg">
			<CardHeader className="pb-3">
				<div className="relative mb-3 aspect-square rounded-lg bg-gray-100 sm:aspect-square md:aspect-[4/3] lg:aspect-square">
					{product.image ? (
						<img
							src={product.image}
							alt={product.productCode}
							className="h-full w-full rounded-lg object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-gray-400">
							<Package className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
						</div>
					)}
				</div>
				<CardTitle className="text-base sm:text-lg md:text-lg">{product.productCode}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2 text-gray-600 text-sm sm:text-base md:text-sm">
					<p>尺寸: {product.availableDimensions.join(', ')}</p>
					<p>重量: {product.weight}kg</p>
					<p>包含: {product.pieceCount}个</p>
					<div className="mt-2 flex flex-wrap gap-1">
						{product.availableColors.map(color => (
							<Badge key={color} variant="secondary" className="text-xs sm:text-sm md:text-xs">
								{color}
							</Badge>
						))}
					</div>
				</div>
				<div className="mt-4 border-t pt-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-bold text-base text-primary sm:text-lg md:text-lg">
								{formatPrice(product.unitPrice)}
							</p>
							<p className="text-gray-500 text-xs sm:text-sm md:text-xs">
								起订: {product.minimumOrderQty}件
							</p>
						</div>
						<Link href={`/products/${product.id}`}>
							<Button size="sm" className="text-xs sm:text-sm md:text-sm">查看详情</Button>
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
			<main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
				{/* 欢迎区域 */}
				<div className="mb-8 text-center sm:mb-10 lg:mb-12">
					<h2 className="mb-3 font-bold text-2xl text-gray-900 sm:mb-4 sm:text-3xl lg:text-3xl">
						专业攀岩定制服务
					</h2>
					<p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg lg:text-lg">
						提供高质量的攀岩板材定制服务，支持多重规格和颜色选择，满足您的个性化订单需求
					</p>
				</div>

				{/* 功能特色 */}
				<div className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-6 lg:mb-12 lg:grid-cols-3">
					<Card>
						<CardContent className="p-4 text-center sm:p-6">
							<Package className="mx-auto mb-3 h-10 w-10 text-primary sm:mb-4 sm:h-12 sm:w-12" />
							<h3 className="mb-2 font-semibold text-base sm:text-lg">多种规格</h3>
							<p className="text-gray-600 text-sm sm:text-base">提供多种尺寸和规格选择，满足不同的订单需求</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 text-center sm:p-6">
							<ShoppingCart className="mx-auto mb-3 h-10 w-10 text-primary sm:mb-4 sm:h-12 sm:w-12" />
							<h3 className="mb-2 font-semibold text-base sm:text-lg">在线下单</h3>
							<p className="text-gray-600 text-sm sm:text-base">便捷的在线下单系统，实时跟踪订单状态</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 text-center sm:p-6">
							<FileText className="mx-auto mb-3 h-10 w-10 text-primary sm:mb-4 sm:h-12 sm:w-12" />
							<h3 className="mb-2 font-semibold text-base sm:text-lg">快速生产</h3>
							<p className="text-gray-600 text-sm sm:text-base">专业生产线，确保产品质量和交货时间</p>
						</CardContent>
					</Card>
				</div>

				{/* 热门产品 */}
				<section>
					<div className="mb-4 flex items-center justify-between sm:mb-6">
						<h3 className="font-bold text-gray-900 text-xl sm:text-2xl">热门产品</h3>
						<Link href="/products">
							<Button variant="outline" className="text-sm sm:text-base">查看全部</Button>
						</Link>
					</div>
					
					{isLoading ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
							{[...Array(4)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardHeader>
										<div className="mb-3 aspect-square rounded-lg bg-gray-200" />
										<div className="h-4 rounded bg-gray-200" />
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="h-3 rounded bg-gray-200" />
											<div className="h-3 rounded bg-gray-200" />
											<div className="h-3 w-2/3 rounded bg-gray-200" />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : featuredProducts.length > 0 ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
							{featuredProducts.map(product => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>
					) : (
						<div className="py-8 text-center sm:py-12">
							<Package className="mx-auto mb-4 h-16 w-16 text-gray-400 sm:h-20 sm:w-20" />
							<h4 className="mb-2 font-semibold text-gray-900 text-lg sm:text-xl">暂无产品数据</h4>
							<p className="mb-4 text-gray-600 text-sm sm:text-base">
								系统中暂未有产品信息，请联系管理员上传产品或配置云端同步
							</p>
							{!isAuthenticated && (
								<Link href="/login">
									<Button variant="outline" className="text-sm sm:text-base">
										登录查看更多
									</Button>
								</Link>
							)}
						</div>
					)}
				</section>

				{/* 如果未登录，显示登录提示 */}
				{!isAuthenticated && (
					<div className="mt-8 text-center sm:mt-10 lg:mt-12">
						<Card className="mx-auto max-w-md">
							<CardContent className="p-4 sm:p-6">
								<h4 className="mb-2 font-semibold text-base sm:text-lg">开始您的定制之旅</h4>
								<p className="mb-4 text-gray-600 text-sm sm:text-base">
									登录后即可浏览完整产品目录并进行在线下单
								</p>
								<div className="text-center">
									<Link href="/login">
										<Button className="text-sm sm:text-base">立即登录</Button>
									</Link>
									
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</main>

			{/* 页脚 */}
			<footer className="mt-12 bg-gray-900 text-white sm:mt-16 lg:mt-20">
				<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
					<div className="text-center">
						<p className="text-gray-400 text-sm sm:text-base">
							© 2025 攀岩墙定制系统. 专业攀岩配套解决方案供应商.
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
