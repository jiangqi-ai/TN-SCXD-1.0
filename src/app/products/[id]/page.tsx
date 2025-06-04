'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Package, Star, Truck, Shield, Phone, Edit } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { mockProductService } from '@/lib/services/mockDataService';
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
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedDimension, setSelectedDimension] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await mockProductService.getById(resolvedParams.id);
        if (productData) {
          setProduct(productData);
          setSelectedColor(productData.availableColors[0] || '');
          setSelectedDimension(productData.availableDimensions[0] || '');
          setQuantity(productData.minimumOrderQty);
        } else {
          toast.error('产品未找到');
          router.push('/products');
        }
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('加载产品详情失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [resolvedParams.id, router]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('请先登录后再添加商品');
      return;
    }

    if (!product) return;

    if (!selectedColor) {
      toast.error('请选择颜色');
      return;
    }

    if (!selectedDimension) {
      toast.error('请选择尺寸');
      return;
    }

    addItem(product, selectedColor, selectedDimension, quantity);
    toast.success('商品已添加到购物车');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">产品未找到</h1>
            <Link href="/products">
              <Button>返回产品列表</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回产品列表
            </Button>
          </Link>
          {user?.role === 'admin' && (
            <Link href={`/admin/products/edit?id=${product.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                编辑产品
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>
          </div>

          {/* 产品信息 */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.productCode}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">(5.0 评分)</span>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-primary mb-6">
                {formatPrice(product.unitPrice * quantity)}
                <span className="text-lg text-gray-600 font-normal ml-2">
                  (单价: {formatPrice(product.unitPrice)})
                </span>
              </div>
            </div>

            {/* 产品规格 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">产品规格</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                <label className="text-lg font-medium mb-2 block">颜色选择:</label>
                <div className="flex flex-wrap gap-2">
                  {product.availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-md border transition-colors ${
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
                <label className="text-lg font-medium mb-2 block">尺寸选择:</label>
                <div className="flex flex-wrap gap-2">
                  {product.availableDimensions.map(dimension => (
                    <button
                      key={dimension}
                      onClick={() => setSelectedDimension(dimension)}
                      className={`px-4 py-2 rounded-md border transition-colors ${
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
                <label className="text-lg font-medium mb-2 block">购买数量:</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(product.minimumOrderQty, quantity - 1))}
                    disabled={quantity <= product.minimumOrderQty}
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 border rounded text-center min-w-16 font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                  <span className="text-sm text-gray-600 ml-2">
                    (最低起订 {product.minimumOrderQty} 件)
                  </span>
                </div>
              </div>

              {/* 购买按钮 */}
              <div className="pt-4">
                <Button 
                  size="lg"
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={!isAuthenticated}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAuthenticated ? '加入购物车' : '请先登录'}
                </Button>
              </div>
            </div>

            {/* 服务保障 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">服务保障</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm">质量保证，有问题随时更换</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm">客服电话：13632603365</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm">客服邮箱：good-181@163.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 产品详细描述 */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>产品详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed">
                  {product.productCode} 是我们精心设计的攀岩装备产品，采用高质量材料制作而成。
                  适用于各种攀岩环境和难度等级，为攀岩爱好者提供可靠的安全保障和优秀的使用体验。
                </p>
                {product.features && product.features.length > 0 && (
                  <>
                    <h4 className="text-lg font-medium mt-6 mb-3">产品特点</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </>
                )}
                {product.applications && (
                  <>
                    <h4 className="text-lg font-medium mt-6 mb-3">适用场景</h4>
                    <p className="text-gray-600">
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