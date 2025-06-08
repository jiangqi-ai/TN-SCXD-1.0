'use client';

import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productService } from '@/lib/services/productService';
import { formatPrice } from '@/lib/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import type { Product } from '@/types';
import { 
  ArrowLeft, 
  Package, 
  Phone, 
  Shield, 
  ShoppingCart, 
  Star 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="aspect-square rounded-lg bg-gray-200"></div>
              <div className="space-y-4">
                <div className="h-8 rounded bg-gray-200"></div>
                <div className="h-6 w-2/3 rounded bg-gray-200"></div>
                <div className="h-10 w-1/2 rounded bg-gray-200"></div>
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
      
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* 返回按钮 */}
        <div className="mb-4 sm:mb-6">
          <Link href="/products">
            <Button variant="outline" size="sm" className="text-sm sm:text-base">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回产品列表
            </Button>
          </Link>
        </div>

        {/* 产品主要信息 */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          {/* 产品图片 */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.productCode}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <Package className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
                </div>
              )}
            </div>
          </div>

          {/* 产品信息 */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="mb-2 font-bold text-2xl text-gray-900 sm:text-3xl lg:text-3xl">{product.productCode}</h1>
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4" />
                  ))}
                  <span className="ml-2 text-gray-600 text-xs sm:text-sm">(5.0 评分)</span>
                </div>
              </div>
              
              <div className="mb-4 font-bold text-2xl text-primary sm:mb-6 sm:text-3xl lg:text-3xl">
                {formatPrice(product.unitPrice * quantity)}
                <span className="ml-2 font-normal text-base text-gray-600 sm:text-lg">
                  (单价: {formatPrice(product.unitPrice)})
                </span>
              </div>
            </div>

            {/* 产品规格 */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-base sm:text-lg">产品规格</h3>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4 sm:text-base">
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
                <label className="mb-2 block font-medium text-base sm:text-lg">颜色选择:</label>
                <div className="flex flex-wrap gap-2">
                  {product.availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors sm:px-4 sm:py-2 sm:text-base ${
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
                <label className="mb-2 block font-medium text-base sm:text-lg">尺寸选择:</label>
                <div className="flex flex-wrap gap-2">
                  {product.availableDimensions.map(dimension => (
                    <button
                      key={dimension}
                      onClick={() => setSelectedDimension(dimension)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors sm:px-4 sm:py-2 sm:text-base ${
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
                <label className="mb-2 block font-medium text-base sm:text-lg">购买数量:</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(product.minimumOrderQty, quantity - 1))}
                    disabled={quantity <= product.minimumOrderQty}
                    className="h-8 w-8 p-0 sm:h-10 sm:w-10"
                  >
                    -
                  </Button>
                  <span className="min-w-12 rounded border px-3 py-2 text-center font-medium text-sm sm:min-w-16 sm:px-4 sm:py-2 sm:text-base">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 p-0 sm:h-10 sm:w-10"
                  >
                    +
                  </Button>
                  <span className="ml-2 text-gray-600 text-xs sm:text-sm">
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
                  <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {isAuthenticated ? '加入购物车' : '请先登录'}
                </Button>
              </div>
            </div>

            {/* 服务保障 */}
            <div className="border-t pt-4 sm:pt-6">
              <h3 className="mb-3 font-medium text-base sm:mb-4 sm:text-lg">服务保障</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center">
                  <Shield className="mr-3 h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">质量保证，有问题随时更换</span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-3 h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">客服电话：13632603365</span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-3 h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
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
                <p className="text-gray-600 text-sm leading-relaxed sm:text-base">
                  {product.productCode} 是我们精心设计的攀岩装备产品，采用高质量材料制作而成。
                  适用于各种攀岩环境和难度等级，为攀岩爱好者提供可靠的安全保障和优秀的使用体验。
                </p>
                {product.features && product.features.length > 0 && (
                  <>
                    <h4 className="mt-4 mb-2 font-medium text-base sm:mt-6 sm:mb-3 sm:text-lg">产品特点</h4>
                    <ul className="list-inside list-disc space-y-1 text-gray-600 text-sm sm:space-y-2 sm:text-base">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </>
                )}
                {product.applications && (
                  <>
                    <h4 className="mt-4 mb-2 font-medium text-base sm:mt-6 sm:mb-3 sm:text-lg">适用场景</h4>
                    <p className="text-gray-600 text-sm sm:text-base">
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