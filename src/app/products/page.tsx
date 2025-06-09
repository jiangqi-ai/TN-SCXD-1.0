'use client';

import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
// import { productService, getStorageType } from '@/lib/services/hybridProductService';
import { debounce, formatPrice } from '@/lib/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import type { Product } from '@/types';
import { ArrowLeft, Filter, Minus, Package, Plus, Search, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import React from 'react';

// 优化的产品卡片组件
const ProductCard = React.memo(({ product }: { product: Product }) => {
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const [selectedColor, setSelectedColor] = useState(product.availableColors[0] || '');
  const [selectedDimension, setSelectedDimension] = useState(product.availableDimensions[0] || '');
  const [quantity, setQuantity] = useState(product.minimumOrderQty);

  const handleAddToCart = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('请先登录后再添加商品');
      return;
    }

    if (!selectedColor) {
      toast.error('请选择颜色');
      return;
    }

    if (!selectedDimension) {
      toast.error('请选择尺寸');
      return;
    }

    addItem(product, selectedColor, selectedDimension, quantity);
  }, [isAuthenticated, selectedColor, selectedDimension, quantity, product, addItem]);

  const incrementQuantity = useCallback(() => {
    setQuantity(prev => prev + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity(prev => Math.max(product.minimumOrderQty, prev - 1));
  }, [product.minimumOrderQty]);

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="relative mb-3 aspect-square rounded-lg bg-gray-100 sm:aspect-square md:aspect-[4/3] lg:aspect-square">
          {product.image ? (
            <img
              src={product.image}
              alt={product.productCode}
              className="h-full w-full rounded-lg object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </div>
          )}
        </div>
        <CardTitle className="text-lg sm:text-xl md:text-lg">{product.productCode}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1 text-gray-600 text-sm sm:text-base md:text-sm">
            <p>重量: {product.weight}kg</p>
            <p>包含: {product.pieceCount}个</p>
            <p>起订: {product.minimumOrderQty}件</p>
          </div>

          {/* 颜色选择 */}
          <div>
            <label className="font-medium text-sm sm:text-base md:text-sm">颜色选择:</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {product.availableColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`rounded border px-2 py-1 text-xs sm:text-sm md:text-xs transition-colors ${
                    selectedColor === color
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-primary"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* 尺寸选择 */}
          <div>
            <label className="font-medium text-sm sm:text-base md:text-sm">尺寸选择:</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {product.availableDimensions.map(dimension => (
                <button
                  key={dimension}
                  onClick={() => setSelectedDimension(dimension)}
                  className={`rounded border px-2 py-1 text-xs sm:text-sm md:text-xs transition-colors ${
                    selectedDimension === dimension
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-primary"
                  }`}
                >
                  {dimension}
                </button>
              ))}
            </div>
          </div>

          {/* 数量选择 */}
          <div>
            <label className="font-medium text-sm sm:text-base md:text-sm">数量:</label>
            <div className="mt-1 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={decrementQuantity}
                disabled={quantity <= product.minimumOrderQty}
                className="h-8 w-8 p-0 sm:h-10 sm:w-10 md:h-8 md:w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[40px] text-center text-sm sm:text-base">{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={incrementQuantity}
                className="h-8 w-8 p-0 sm:h-10 sm:w-10 md:h-8 md:w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-lg text-primary sm:text-xl">
                  {formatPrice(product.unitPrice)}
                </p>
                <p className="text-gray-500 text-sm">
                  总计: {formatPrice(product.unitPrice * quantity)}
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleAddToCart}
              disabled={!isAuthenticated}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isAuthenticated ? '加入购物车' : '请先登录'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id;
});

ProductCard.displayName = 'ProductCard';

// 骨架屏组件
const ProductSkeleton = React.memo(() => (
  <Card className="animate-pulse">
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
));

ProductSkeleton.displayName = 'ProductSkeleton';

export default function ProductsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 使用防抖的搜索
  const debouncedSearchTerm = useMemo(() => {
    const handler = setTimeout(() => {
      return searchTerm;
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 使用 useCallback 优化数据加载函数
  const loadProducts = useCallback(async () => {
    try {
      console.log('🔄 加载产品...');
      const response = await fetch('/api/products?limit=50'); // 限制初始加载数量
      if (!response.ok) {
        throw new Error('获取产品列表失败');
      }
      const data = await response.json();
      setProducts(data);
      console.log('✅ 产品加载成功:', data.length, '个产品');
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('加载产品失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 获取所有可用颜色（使用useMemo优化）
  const allColors = useMemo(() => {
    const colorSet = new Set<string>();
    products.forEach(product => {
      product.availableColors.forEach(color => colorSet.add(color));
    });
    return Array.from(colorSet);
  }, [products]);

  // 筛选产品（使用useMemo优化）
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 搜索筛选
      const matchesSearch = searchTerm === '' || 
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.availableDimensions.some(dimension => 
          dimension.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // 颜色筛选
      const matchesColor = selectedColors.length === 0 ||
        selectedColors.some(color => product.availableColors.includes(color));

      // 价格筛选
      const matchesPrice = product.unitPrice >= priceRange[0] && product.unitPrice <= priceRange[1];

      // 分类筛选
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      return matchesSearch && matchesColor && matchesPrice && matchesCategory;
    });
  }, [products, searchTerm, selectedColors, priceRange, selectedCategory]);

  const handleColorFilter = useCallback((color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedColors([]);
    setPriceRange([0, 5000]);
    setSelectedCategory('all');
  }, []);

  // 骨架屏数组
  const skeletonArray = useMemo(() => Array(12).fill(null), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="font-bold text-2xl text-gray-900 sm:text-3xl">产品目录</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* 筛选侧边栏 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  筛选条件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 搜索框 */}
                <div>
                  <label className="mb-2 block font-medium text-sm">搜索产品</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="搜索产品代码或规格..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 颜色筛选 */}
                {allColors.length > 0 && (
                  <div>
                    <label className="mb-2 block font-medium text-sm">颜色</label>
                    <div className="grid grid-cols-2 gap-2">
                      {allColors.map(color => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${color}`}
                            checked={selectedColors.includes(color)}
                            onCheckedChange={() => handleColorFilter(color)}
                          />
                          <label
                            htmlFor={`color-${color}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {color}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 清除筛选 */}
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  清除所有筛选
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 产品列表 */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 text-sm">
                {isLoading ? '加载中...' : `共找到 ${filteredProducts.length} 个产品`}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {skeletonArray.map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 font-semibold text-lg text-gray-900">没有找到相关产品</h3>
                <p className="text-gray-600">请尝试调整筛选条件或清除所有筛选</p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  清除筛选条件
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 