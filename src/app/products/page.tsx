'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, ShoppingCart, ArrowLeft, Package, Minus, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { productService } from '@/lib/services/productService';
import { formatPrice, debounce } from '@/lib/utils/helpers';
import type { Product } from '@/types';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

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
        // 如果用户已登录且有客户类型，只获取对应的产品
        const customerType = user?.customerType;
        const data = await productService.getAll(customerType);
        setProducts(data);
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
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="aspect-square relative bg-gray-100 rounded-lg mb-3 sm:aspect-square md:aspect-[4/3] lg:aspect-square">
            {product.image ? (
              <img
                src={product.image}
                alt={product.productCode}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
              </div>
            )}
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-lg">{product.productCode}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-1 text-sm sm:text-base md:text-sm text-gray-600">
              <p>重量: {product.weight}kg</p>
              <p>包含: {product.pieceCount}个</p>
              <p>起订: {product.minimumOrderQty}件</p>
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="text-sm sm:text-base md:text-sm font-medium">颜色选择:</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {product.availableColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-2 py-1 text-xs sm:text-sm md:text-xs rounded border ${
                      selectedColor === color
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* 尺寸选择 */}
            <div>
              <label className="text-sm sm:text-base md:text-sm font-medium">尺寸选择:</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {product.availableDimensions.map(dimension => (
                  <button
                    key={dimension}
                    onClick={() => setSelectedDimension(dimension)}
                    className={`px-2 py-1 text-xs sm:text-sm md:text-xs rounded border ${
                      selectedDimension === dimension
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                    }`}
                  >
                    {dimension}
                  </button>
                ))}
              </div>
            </div>

            {/* 数量选择 */}
            <div>
              <label className="text-sm sm:text-base md:text-sm font-medium">数量:</label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(product.minimumOrderQty, quantity - 1))}
                  disabled={quantity <= product.minimumOrderQty}
                  className="h-8 w-8 sm:h-10 sm:w-10 md:h-8 md:w-8 p-0"
                >
                  -
                </Button>
                <span className="px-3 py-1 border rounded text-center min-w-12 text-sm sm:text-base md:text-sm">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8 sm:h-10 sm:w-10 md:h-8 md:w-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-lg sm:text-xl md:text-lg font-bold text-primary">
                    {formatPrice(product.unitPrice)}
                  </p>
                  <p className="text-sm sm:text-base md:text-sm text-gray-500">单价</p>
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-xl md:text-lg font-bold">
                    {formatPrice(product.unitPrice * quantity)}
                  </p>
                  <p className="text-sm sm:text-base md:text-sm text-gray-500">小计</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full text-sm sm:text-base md:text-sm"
                  onClick={handleAddToCart}
                  disabled={!isAuthenticated}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 返回按钮 */}
        <div className="mb-4 sm:mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">产品中心</h1>
          <p className="text-sm sm:text-base text-gray-600">
            浏览我们的攀岩产品，选择适合您需求的配套解决方案
          </p>
        </div>

        {/* 分类菜单栏 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              全部产品
            </button>
            <button
              onClick={() => setSelectedCategory('攀岩板材')}
              className={`px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                selectedCategory === '攀岩板材'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              攀岩板材
            </button>
            <button
              onClick={() => setSelectedCategory('岩点')}
              className={`px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                selectedCategory === '岩点'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              岩点
            </button>
            <button
              onClick={() => setSelectedCategory('五金配件')}
              className={`px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                selectedCategory === '五金配件'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              五金配件
            </button>
            <button
              onClick={() => setSelectedCategory('复合板')}
              className={`px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                selectedCategory === '复合板'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              复合板
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
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
                  <label className="text-sm sm:text-sm font-medium">搜索</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  <label className="text-sm sm:text-sm font-medium">颜色</label>
                  <div className="space-y-2 mt-2">
                    {allColors.map(color => (
                      <div key={color} className="flex items-center space-x-2">
                        <Checkbox
                          id={color}
                          checked={selectedColors.includes(color)}
                          onCheckedChange={() => handleColorFilter(color)}
                        />
                        <label htmlFor={color} className="text-sm sm:text-base cursor-pointer">
                          {color}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 价格筛选 */}
                <div>
                  <label className="text-sm sm:text-sm font-medium">价格范围</label>
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
                    <p className="text-xs sm:text-xs text-gray-500">
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
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600">
                找到 {filteredProducts.length} 个产品
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
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
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-base sm:text-lg text-gray-500 mb-4">没有找到符合条件的产品</p>
                <Button onClick={clearFilters} className="text-sm sm:text-base">清除筛选条件</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 