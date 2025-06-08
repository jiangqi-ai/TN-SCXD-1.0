'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount, getTotalItems } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-md text-center">
          <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="mb-4 font-bold text-2xl text-gray-900">请先登录</h2>
          <p className="mb-6 text-gray-600">
            您需要登录后才能查看购物车
          </p>
          <Link href="/login">
            <Button>立即登录</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-md text-center">
          <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="mb-4 font-bold text-2xl text-gray-900">购物车是空的</h2>
          <p className="mb-6 text-gray-600">
            还没有添加任何商品，去产品中心看看吧
          </p>
          <Link href="/products">
            <Button>
              <Package className="mr-2 h-4 w-4" />
              浏览产品
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setIsCheckingOut(true);
    // 模拟检查过程
    setTimeout(() => {
      router.push('/checkout');
      setIsCheckingOut(false);
    }, 500);
  };

  const handleRemoveItem = (productId: string, color: string, dimension: string) => {
    removeItem(productId, color, dimension);
  };

  const handleUpdateQuantity = (productId: string, color: string, dimension: string, quantity: number, minimumOrderQty: number) => {
    if (quantity >= minimumOrderQty) {
      updateQuantity(productId, color, dimension, quantity);
    }
  };

  const CartItem = ({ item }: { item: typeof items[0] }) => (
    <div className="flex gap-4 border-b p-4">
      <div className="flex-shrink-0">
        <div className="flex aspect-square w-16 items-center justify-center rounded bg-gray-100">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.productCode}
              className="h-full w-full rounded object-cover"
            />
          ) : (
            <Package className="h-6 w-6 text-gray-400" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-900 text-lg">{item.productCode}</h3>
        <div className="mt-1 space-y-1 text-gray-600 text-sm">
          <p>规格: {item.selectedDimension}</p>
          <p>重量: {item.weight}kg | 包含: {item.pieceCount}个</p>
          <p>颜色: <span className="font-medium">{item.selectedColor}</span></p>
          <p>单价: {formatPrice(item.unitPrice)}</p>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleRemoveItem(item.productId, item.selectedColor, item.selectedDimension)}
        >
          移除
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUpdateQuantity(item.productId, item.selectedColor, item.selectedDimension, item.quantity - 1, item.minimumOrderQty)}
            disabled={item.quantity <= item.minimumOrderQty}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="min-w-12 rounded border px-3 py-1 text-center">
            {item.quantity}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUpdateQuantity(item.productId, item.selectedColor, item.selectedDimension, item.quantity + 1, item.minimumOrderQty)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="text-right">
          <p className="font-semibold text-lg">{formatPrice(item.subtotal)}</p>
          <p className="text-gray-500 text-sm">小计</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 font-bold text-3xl text-gray-900">购物车</h1>
          <p className="text-gray-600">
            共 {getTotalItems()} 件商品
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 购物车商品列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>商品清单</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  清空购物车
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {items.map(item => (
                  <CartItem 
                    key={`${item.productId}-${item.selectedColor}`} 
                    item={item} 
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 订单摘要 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>订单摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={`${item.productId}-${item.selectedColor}`} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.productCode} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-base">
                    <span>商品总价</span>
                    <span>{formatPrice(getTotalAmount())}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>运费</span>
                    <span>到付</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>税费</span>
                    <span>结算时计算</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>小计</span>
                  <span>{formatPrice(getTotalAmount())}</span>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? '处理中...' : '立即结算'}
                  </Button>

                  <Link href="/products">
                    <Button variant="outline" className="w-full">
                      继续购物
                    </Button>
                  </Link>
                </div>

                <div className="space-y-1 text-gray-500 text-xs">
                  <p>• 价格不含运费和税费</p>
                  <p>• 运费到付，实际费用根据收货地址计算</p>
                  <p>• 支持批量定制，量大从优</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 推荐商品 */}
        <div className="mt-12">
          <h3 className="mb-6 font-semibold text-gray-900 text-xl">推荐商品</h3>
          <div className="py-8 text-center text-gray-500">
            <p>暂无推荐商品</p>
            <Link href="/products" className="text-primary hover:underline">
              浏览更多产品
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 