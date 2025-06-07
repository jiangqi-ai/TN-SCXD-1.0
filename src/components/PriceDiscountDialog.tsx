import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Percent, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';
import type { Order, OrderItem } from '@/types';
import { toast } from 'sonner';

interface PriceDiscountDialogProps {
  order: Order;
  onUpdateOrder?: (updatedOrder: Order) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ItemDiscount {
  itemIndex: number;
  discountPercent: number;
  newPrice: number;
  newSubtotal: number;
}

export default function PriceDiscountDialog({ 
  order, 
  onUpdateOrder, 
  trigger,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange
}: PriceDiscountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemDiscounts, setItemDiscounts] = useState<ItemDiscount[]>([]);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  // 使用外部控制的开关状态
  const dialogIsOpen = externalIsOpen !== undefined ? externalIsOpen : isOpen;
  const setDialogIsOpen = externalOnOpenChange || setIsOpen;

  // 初始化折扣数据
  useEffect(() => {
    if (dialogIsOpen) {
      const initialDiscounts: ItemDiscount[] = order.items.map((item, index) => ({
        itemIndex: index,
        discountPercent: 0,
        newPrice: item.unitPrice,
        newSubtotal: item.subtotal
      }));
      setItemDiscounts(initialDiscounts);
      setGlobalDiscountPercent(0);
    }
  }, [dialogIsOpen, order.items]);

  // 更新单个商品折扣
  const updateItemDiscount = (itemIndex: number, discountPercent: number) => {
    const item = order.items[itemIndex];
    if (!item) return;

    // 检查是否可以打折
    if (!item.discountable) {
      toast.error(`${item.productCode} 不支持打折`);
      return;
    }

    // 检查折扣是否超过最大值
    if (discountPercent > item.maxDiscount) {
      toast.error(`${item.productCode} 最大折扣为 ${item.maxDiscount}%`);
      return;
    }

    const discountMultiplier = (100 - discountPercent) / 100;
    const newPrice = item.unitPrice * discountMultiplier;
    const newSubtotal = newPrice * item.quantity;

    setItemDiscounts(prev => prev.map(discount => 
      discount.itemIndex === itemIndex 
        ? { ...discount, discountPercent, newPrice, newSubtotal }
        : discount
    ));
  };

  // 应用全局折扣
  const applyGlobalDiscount = () => {
    const updatedDiscounts = order.items.map((item, index) => {
      // 检查是否可以打折
      if (!item.discountable) {
        return itemDiscounts[index] || {
          itemIndex: index,
          discountPercent: 0,
          newPrice: item.unitPrice,
          newSubtotal: item.subtotal
        };
      }

      // 使用最小值（全局折扣或商品最大折扣）
      const actualDiscount = Math.min(globalDiscountPercent, item.maxDiscount);
      const discountMultiplier = (100 - actualDiscount) / 100;
      const newPrice = item.unitPrice * discountMultiplier;
      const newSubtotal = newPrice * item.quantity;

      return {
        itemIndex: index,
        discountPercent: actualDiscount,
        newPrice,
        newSubtotal
      };
    });

    setItemDiscounts(updatedDiscounts);
  };

  // 计算总价
  const calculateTotals = () => {
    const originalTotal = order.totalAmount;
    const newTotal = itemDiscounts.reduce((sum, discount) => sum + discount.newSubtotal, 0);
    const totalSavings = originalTotal - newTotal;
    const totalDiscountPercent = originalTotal > 0 ? ((totalSavings / originalTotal) * 100) : 0;

    return {
      originalTotal,
      newTotal,
      totalSavings,
      totalDiscountPercent
    };
  };

  // 应用折扣
  const applyDiscounts = async () => {
    setIsApplying(true);
    try {
      // 创建更新后的订单项
      const updatedItems: OrderItem[] = order.items.map((item, index) => {
        const discount = itemDiscounts[index];
        if (!discount) return item;

        return {
          ...item,
          unitPrice: discount.newPrice,
          subtotal: discount.newSubtotal,
          originalPrice: item.unitPrice, // 保存原价
          discountPercent: discount.discountPercent
        };
      });

      // 创建更新后的订单
      const totals = calculateTotals();
      const updatedOrder: Order = {
        ...order,
        items: updatedItems,
        totalAmount: totals.newTotal,
        originalAmount: order.totalAmount, // 保存原总价
        discountAmount: totals.totalSavings
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      onUpdateOrder?.(updatedOrder);
      setDialogIsOpen(false);
      toast.success('价格折扣已应用');
    } catch (error) {
      console.error('Apply discounts failed:', error);
      toast.error('应用折扣失败');
    } finally {
      setIsApplying(false);
    }
  };

  const totals = calculateTotals();

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Calculator className="h-4 w-4 mr-2" />
      调整价格
    </Button>
  );

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            价格折扣调整 - {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 全局折扣设置 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">全局折扣设置</h3>
              <Button size="sm" onClick={applyGlobalDiscount}>
                应用全局折扣
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="globalDiscount">折扣百分比</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="globalDiscount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={globalDiscountPercent}
                    onChange={(e) => setGlobalDiscountPercent(Number(e.target.value))}
                    className="w-24"
                  />
                  <Percent className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                注意：不支持打折的商品将保持原价
              </div>
            </div>
          </div>

          {/* 商品列表 */}
          <div className="space-y-4">
            <h3 className="font-medium">商品价格调整</h3>
            {order.items.map((item, index) => {
              const discount = itemDiscounts[index] || {
                itemIndex: index,
                discountPercent: 0,
                newPrice: item.unitPrice,
                newSubtotal: item.subtotal
              };

              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productCode}</h4>
                      <p className="text-sm text-gray-600">
                        {item.selectedDimension} | {item.selectedColor} | 数量: {item.quantity}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.discountable ? (
                          <Badge variant="default" className="text-xs">
                            可打折（最高{item.maxDiscount}%）
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            不支持打折
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">原价: {formatPrice(item.unitPrice)}</p>
                      <p className="text-sm text-gray-500">原小计: {formatPrice(item.subtotal)}</p>
                    </div>
                  </div>

                  {item.discountable && (
                    <div className="grid grid-cols-3 gap-4 items-end">
                      <div>
                        <Label htmlFor={`discount-${index}`}>折扣百分比</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            id={`discount-${index}`}
                            type="number"
                            min="0"
                            max={item.maxDiscount}
                            step="0.1"
                            value={discount.discountPercent}
                            onChange={(e) => updateItemDiscount(index, Number(e.target.value))}
                            className="w-24"
                          />
                          <Percent className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <Label>新单价</Label>
                        <p className="font-medium text-primary mt-1">
                          {formatPrice(discount.newPrice)}
                        </p>
                      </div>
                      <div>
                        <Label>新小计</Label>
                        <p className="font-medium text-primary mt-1">
                          {formatPrice(discount.newSubtotal)}
                        </p>
                      </div>
                    </div>
                  )}

                  {!item.discountable && (
                    <div className="text-center py-2 text-gray-500">
                      此商品不支持价格调整
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Separator />

          {/* 价格汇总 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">价格汇总</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>原订单总额:</span>
                <span>{formatPrice(totals.originalTotal)}</span>
              </div>
              <div className="flex justify-between text-primary font-medium">
                <span>调整后总额:</span>
                <span>{formatPrice(totals.newTotal)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>节省金额:</span>
                <span>{formatPrice(totals.totalSavings)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>总体折扣:</span>
                <span>{totals.totalDiscountPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setDialogIsOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={applyDiscounts}
              disabled={isApplying || totals.newTotal === totals.originalTotal}
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  应用中...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  应用折扣
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 