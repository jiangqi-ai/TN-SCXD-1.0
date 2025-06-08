'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  Package, 
  Shield, 
  Phone 
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { productService } from '@/lib/services/productService';
import { formatPrice } from '@/lib/utils/helpers';
import type { Product } from '@/types';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedDimension, setSelectedDimension] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const resolvedParams = await params;
        const productData = await productService.getById(resolvedParams.id);
        
        if (!productData) {
          toast.error('产品不存在');
          router.push('/products');
          return;
        }
        
        setProduct(productData);
        setSelectedColor(productData.availableColors[0] || '');
        setSelectedDimension(productData.availableDimensions[0] || '');
        setQuantity(productData.minimumOrderQty);
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('加载产品失败');
        router.push('/products');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [params, router]);

  const handleAddToCart = () => {
    if (!product || !isAuthenticated) {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 返回按钮 */}
        <div className="mb-4 sm:mb-6">
          <Link href="/products">
            <Button variant="outline" size="sm" className="text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回产品列表
            </Button>
          </Link>
        </div>

        {/* 产品主要信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* 产品图片 */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.productCode}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
                </div>
              )}
            </div>
          </div>

          {/* 产品信息 */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-2">{product.productCode}</h1>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-xs sm:text-sm text-gray-600">(5.0 评分)</span>
                </div>
              </div>
              
              <div className="text-2xl sm:text-3xl lg:text-3xl font-bold text-primary mb-4 sm:mb-6">
                {formatPrice(product.unitPrice * quantity)}
                <span className="text-base sm:text-lg text-gray-600 font-normal ml-2">
                  (单价: {formatPrice(product.unitPrice)})
                </span>
              </div>
            </div>

            {/* 产品规格 */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2">产品规格</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                  <div>
                    <span className="text-gray-600">重量:</span>
                    <span className="ml-2 font-medium">{product.weight}kg</span>
                  </div>
                  <div>
                    <span className="text-gray-600">包含数量:</span>
                    <span className="ml-2 font-medium">{product.pieceCount}个</span>
                  </div>
                  <div>
                    <span className="text-gray-600">最低起订:</span>
                    <span className="ml-2 font-medium">{product.minimumOrderQty}件</span>
                  </div>
                  <div>
                    <span className="text-gray-600">库存状态:</span>
                    <Badge className="ml-2" variant="default">现货</Badge>
                  </div>
                </div>
              </div>

              {/* 颜色选择 */}
              <div>
                <label className="text-base sm:text-lg font-medium mb-2 block">颜色选择:</label>
                <div className="flex flex-wrap gap-2">
                  {product.availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md border transition-colors text-sm sm:text-base ${
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
                <label className="text-base sm:text-lg font-medium mb-2 block">尺寸选择:</label>
                <div className="flex flex-wrap gap-2">
                  {product.availableDimensions.map(dimension => (
                    <button
                      key={dimension}
                      onClick={() => setSelectedDimension(dimension)}
                      className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md border transition-colors text-sm sm:text-base ${
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
                <label className="text-base sm:text-lg font-medium mb-2 block">购买数量:</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(product.minimumOrderQty, quantity - 1))}
                    disabled={quantity <= product.minimumOrderQty}
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                  >
                    -
                  </Button>
                  <span className="px-3 py-2 sm:px-4 sm:py-2 border rounded text-center min-w-12 sm:min-w-16 font-medium text-sm sm:text-base">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                  >
                    +
                  </Button>
                  <span className="text-xs sm:text-sm text-gray-600 ml-2">
                    (最低起订 {product.minimumOrderQty} 件)
                  </span>
                </div>
              </div>

              {/* 购买按钮 */}
              <div className="pt-3 sm:pt-4">
                <Button 
                  size="lg"
                  className="w-full text-sm sm:text-base lg:text-lg"
                  onClick={handleAddToCart}
                  disabled={!isAuthenticated}
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {isAuthenticated ? '加入购物车' : '请先登录'}
                </Button>
              </div>
            </div>

            {/* 服务保障 */}
            <div className="border-t pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">服务保障</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-3" />
                  <span className="text-sm sm:text-base">质量保证，有问题随时更换</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-3" />
                  <span className="text-sm sm:text-base">客服电话：13632603365</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-3" />
                  <span className="text-sm sm:text-base">客服邮箱：good-181@163.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 产品详细描述 */}
        <div className="mt-8 sm:mt-10 lg:mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg lg:text-xl">产品详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {product.productCode} 是我们精心设计的攀岩装备产品，采用高质量材料制作而成。
                  适用于各种攀岩环境和难度等级，为攀岩爱好者提供可靠的安全保障和优秀的使用体验。
                </p>
                {product.features && product.features.length > 0 && (
                  <>
                    <h4 className="text-base sm:text-lg font-medium mt-4 sm:mt-6 mb-2 sm:mb-3">产品特点</h4>
                    <ul className="list-disc list-inside space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-600">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </>
                )}
                {product.applications && (
                  <>
                    <h4 className="text-base sm:text-lg font-medium mt-4 sm:mt-6 mb-2 sm:mb-3">适用场景</h4>
                    <p className="text-sm sm:text-base text-gray-600">
                      {product.applications}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}