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
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🔄 加载产品...');
        const response = await fetch('/api/products');
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
    };

    loadProducts();
  }, [user?.customerType]);

  // 获取所有可用颜色
  const allColors = useMemo(() => {
    const colorSet = new Set<string>();
    products.forEach(product => {
      product.availableColors.forEach(color => colorSet.add(color));
    });
    return Array.from(colorSet);
  }, [products]);

  // 筛选产品
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

  const handleColorFilter = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedColors([]);
    setPriceRange([0, 5000]);
    setSelectedCategory('all');
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const [selectedColor, setSelectedColor] = useState(product.availableColors[0] || '');
    const [selectedDimension, setSelectedDimension] = useState(product.availableDimensions[0] || '');
    const [quantity, setQuantity] = useState(product.minimumOrderQty);

    const handleAddToCart = () => {
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
    };

    return (
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
                    className={`rounded border px-2 py-1 text-xs sm:text-sm md:text-xs ${
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
                    className={`rounded border px-2 py-1 text-xs sm:text-sm md:text-xs ${
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
                  onClick={() => setQuantity(Math.max(product.minimumOrderQty, quantity - 1))}
                  disabled={quantity <= product.minimumOrderQty}
                  className="h-8 w-8 p-0 sm:h-10 sm:w-10 md:h-8 md:w-8"
                >
                  -
                </Button>
                <span className="min-w-12 rounded border px-3 py-1 text-center text-sm sm:text-base md:text-sm">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8 p-0 sm:h-10 sm:w-10 md:h-8 md:w-8"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg text-primary sm:text-xl md:text-lg">
                    {formatPrice(product.unitPrice)}
                  </p>
                  <p className="text-gray-500 text-sm sm:text-base md:text-sm">单价</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg sm:text-xl md:text-lg">
                    {formatPrice(product.unitPrice * quantity)}
                  </p>
                  <p className="text-gray-500 text-sm sm:text-base md:text-sm">小计</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full text-sm sm:text-base md:text-sm"
                  onClick={handleAddToCart}
                  disabled={!isAuthenticated}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {isAuthenticated ? '加入购物车' : '请先登录'}
                </Button>
                <Link href={`/products/${product.id}`}>
                  <Button variant="outline" className="w-full text-sm sm:text-base md:text-sm">
                    查看详情
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* 返回按钮 */}
        <div className="mb-4 sm:mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="text-sm sm:text-base">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>

        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 font-bold text-2xl text-gray-900 sm:mb-4 sm:text-3xl lg:text-3xl">产品中心</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            浏览我们的攀岩产品，选择适合您需求的配套解决方案
          </p>
        </div>

        {/* 分类菜单栏 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors sm:text-base ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              全部产品
            </button>
            <button
              onClick={() => setSelectedCategory('攀岩板材')}
              className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors sm:text-base ${
                selectedCategory === '攀岩板材'
                  ? 'bg-primary text-white'
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              攀岩板材
            </button>
            <button
              onClick={() => setSelectedCategory('岩点')}
              className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors sm:text-base ${
                selectedCategory === '岩点'
                  ? 'bg-primary text-white'
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              岩点
            </button>
            <button
              onClick={() => setSelectedCategory('五金配件')}
              className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors sm:text-base ${
                selectedCategory === '五金配件'
                  ? 'bg-primary text-white'
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              五金配件
            </button>
            <button
              onClick={() => setSelectedCategory('复合板')}
              className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors sm:text-base ${
                selectedCategory === '复合板'
                  ? 'bg-primary text-white'
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              复合板
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-8">
          {/* 侧边栏筛选 - 在移动端折叠 */}
          <div className="w-full lg:w-64 lg:flex-shrink-0">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  筛选条件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* 搜索 */}
                <div>
                  <label className="font-medium text-sm sm:text-sm">搜索</label>
                  <div className="relative mt-1">
                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                    <Input
                      placeholder="搜索产品编号或尺寸..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* 颜色筛选 */}
                <div>
                  <label className="font-medium text-sm sm:text-sm">颜色</label>
                  <div className="mt-2 space-y-2">
                    {allColors.map(color => (
                      <div key={color} className="flex items-center space-x-2">
                        <Checkbox
                          id={color}
                          checked={selectedColors.includes(color)}
                          onCheckedChange={() => handleColorFilter(color)}
                        />
                        <label htmlFor={color} className="cursor-pointer text-sm sm:text-base">
                          {color}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 价格筛选 */}
                <div>
                  <label className="font-medium text-sm sm:text-sm">价格范围</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="最低价"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="text-sm sm:text-base"
                      />
                      <Input
                        type="number"
                        placeholder="最高价"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <p className="text-gray-500 text-xs sm:text-xs">
                      当前: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </p>
                  </div>
                </div>

                <Button variant="outline" onClick={clearFilters} className="w-full text-sm sm:text-base">
                  清除筛选
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 产品列表 */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <p className="text-gray-600 text-sm sm:text-base">
                找到 {filteredProducts.length} 个产品
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
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
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center sm:py-12">
                <p className="mb-4 text-base text-gray-500 sm:text-lg">没有找到符合条件的产品</p>
                <Button onClick={clearFilters} className="text-sm sm:text-base">清除筛选条件</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 