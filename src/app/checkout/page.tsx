'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { mockOrderService } from '@/lib/services/mockDataService'
import { formatPrice } from '@/lib/utils/helpers'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import type { CreateOrderRequest } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CreditCard, Package, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const checkoutSchema = z.object({
  shippingAddress: z.object({
    contactName: z.string().min(1, '请输入联系人姓名'),
    phone: z.string().min(1, '请输入联系电话'),
    address: z.string().min(1, '请输入收货地址'),
    company: z.string().optional(),
    notes: z.string().optional(),
  }),
  paymentMethod: z.literal('bill_confirm')
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalAmount, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {
        contactName: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        company: user?.company || '',
        notes: ''
      },
      paymentMethod: 'bill_confirm',
    },
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (items.length === 0) {
      router.push('/cart')
      return
    }
  }, [isAuthenticated, items.length, router])

  const onSubmit = async (data: CheckoutForm) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const orderData: CreateOrderRequest = {
        customerId: user.id,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          unitPrice: item.unitPrice,
          discount: 0, // 默认无折扣，管理员可在审核时调整
        })),
        shippingAddress: {
          contactName: data.shippingAddress.contactName,
          phone: data.shippingAddress.phone,
          address: data.shippingAddress.address,
          company: data.shippingAddress.company || '',
          notes: data.shippingAddress.notes || '',
        },
        paymentMethod: data.paymentMethod,
        totalAmount: getTotalAmount(),
        originalAmount: getTotalAmount(), // 原价等于总价
        discountAmount: 0, // 默认无折扣
      }

      const order = await mockOrderService.create(orderData)
      
      // 清空购物车
      clearCart()
      
      toast.success('订单提交成功！', {
        description: `订单号：${order.orderNumber}`,
      })
      
      // 跳转到订单详情页
      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error('Failed to submit order:', error)
      toast.error('订单提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentMethod = watch('paymentMethod')

  if (!isAuthenticated || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回购物车
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 左侧：收货信息和支付方式 */}
          <div className="space-y-6 lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 收货地址 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="mr-2 h-5 w-5" />
                    收货信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="contactName">联系人姓名 *</Label>
                      <Input
                        id="contactName"
                        {...register('shippingAddress.contactName')}
                        className={errors.shippingAddress?.contactName ? 'border-red-500' : ''}
                      />
                      {errors.shippingAddress?.contactName && (
                        <p className="mt-1 text-red-500 text-sm">
                          {errors.shippingAddress.contactName.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">联系电话 *</Label>
                      <Input
                        id="phone"
                        {...register('shippingAddress.phone')}
                        className={errors.shippingAddress?.phone ? 'border-red-500' : ''}
                      />
                      {errors.shippingAddress?.phone && (
                        <p className="mt-1 text-red-500 text-sm">
                          {errors.shippingAddress.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">公司名称</Label>
                    <Input
                      id="company"
                      {...register('shippingAddress.company')}
                      placeholder="选填"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">详细地址 *</Label>
                    <Textarea
                      id="address"
                      {...register('shippingAddress.address')}
                      placeholder="请输入详细的收货地址"
                      className={errors.shippingAddress?.address ? 'border-red-500' : ''}
                    />
                    {errors.shippingAddress?.address && (
                      <p className="mt-1 text-red-500 text-sm">
                        {errors.shippingAddress.address.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">备注信息</Label>
                    <Textarea
                      id="notes"
                      {...register('shippingAddress.notes')}
                      placeholder="选填，如有特殊要求请说明"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 支付方式 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    支付方式
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setValue('paymentMethod', value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bill_confirm" id="bill_confirm" />
                      <Label htmlFor="bill_confirm">对账单确认</Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMethod === 'bill_confirm' && (
                    <div className="mt-4 rounded-lg bg-blue-50 p-4">
                      <p className="text-blue-800 text-sm">
                        <strong>对账单信息：</strong><br />
                        对账单将通过电子邮件发送给您。请在收到对账单后，按照对账单上的指示进行支付。
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '确认下单'}
              </Button>
            </form>
          </div>

          {/* 右侧：订单摘要 */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  订单摘要
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedColor}`} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.productCode}</p>
                      <p className="text-gray-500 text-xs">
                        {item.selectedColor} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-sm">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>商品总额</span>
                    <span>{formatPrice(getTotalAmount())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>运费</span>
                    <span>到付</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>总计</span>
                    <span className="text-primary">{formatPrice(getTotalAmount())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 