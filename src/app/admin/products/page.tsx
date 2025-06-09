'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { productService } from '@/lib/services/hybridProductService';
import { formatPrice } from '@/lib/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import type { Product, ProductCategory, ProductSubCategory, CustomerType } from '@/types';
import { ArrowLeft, Edit, FileSpreadsheet, MoreHorizontal, Package, Plus, Shield, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProductsManagePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  // 新产品表单数据
  const [newProduct, setNewProduct] = useState({
    productCode: '',
    category: 'climbing-holds' as ProductCategory,
    image: '',
    availableDimensions: [''],
    weight: 0,
    minimumOrderQty: 1,
    availableColors: [''],
    unitPrice: 0,
    remarks: '',
    features: [''],
    applications: '',
    isActive: true
  });

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      toast.error('无权访问此页面');
      router.push('/admin');
      return;
    }

    const loadProducts = async () => {
      try {
        const data = await productService.getAllForAdmin();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('加载产品列表失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [isAuthenticated, user, router]);

  const handleCreateProduct = async () => {
    try {
      // 验证必填字段
      if (!newProduct.productCode.trim()) {
        toast.error('请输入产品编码');
        return;
      }
      if (newProduct.unitPrice <= 0) {
        toast.error('请输入有效的单价');
        return;
      }

      const productData = {
        ...newProduct,
        availableDimensions: newProduct.availableDimensions.filter(d => d.trim()),
        availableColors: newProduct.availableColors.filter(c => c.trim()),
        features: newProduct.features.filter(f => f.trim()),
        pieceCount: 1,
        targetCustomers: ['未分类' as CustomerType],
        discountable: true,
        maxDiscount: 100,
        subCategory: '高密度攀岩板' as ProductSubCategory
      };

      const createdProduct = await productService.create(productData);
      setProducts([createdProduct, ...products]);
      
      // 重置表单
      setNewProduct({
        productCode: '',
        category: '岩点',
        image: '',
        availableDimensions: [''],
        weight: 0,
        minimumOrderQty: 1,
        availableColors: [''],
        unitPrice: 0,
        remarks: '',
        features: [''],
        applications: '',
        isActive: true
      });
      
      setIsDialogOpen(false);
      toast.success('产品创建成功');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('创建产品失败');
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      setTogglingProductId(productId);
      
      const updatedProduct = await productService.update(productId, { isActive: !currentStatus });
      setProducts(products.map(p => p.id === productId ? updatedProduct : p));
      
      toast.success(currentStatus ? '产品已禁用' : '产品已启用');
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      toast.error('操作失败，请重试');
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      console.log(`🔄 准备删除产品: ${productId}`)
      console.log(`🔍 当前产品列表:`, products.map(p => ({ id: p.id, code: p.productCode })))
      
      // 先检查产品是否在当前列表中
      const productExists = products.find(p => p.id === productId)
      if (!productExists) {
        console.log(`❌ 产品在前端列表中不存在: ${productId}`)
        toast.error('产品在当前列表中不存在');
        return;
      }
      
      console.log(`🔍 找到产品:`, productExists)
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      console.log(`🔍 删除API响应状态: ${response.status}`)
      
      if (!response.ok) {
        const error = await response.json();
        console.log(`❌ 删除API错误:`, error)
        throw new Error(error.error || '删除产品失败');
      }

      setProducts(products.filter(p => p.id !== productId));
      toast.success('产品已删除');
      console.log(`✅ 产品删除成功: ${productId}`)
    } catch (error) {
      console.error('❌ 删除产品失败:', error);
      const errorMessage = error instanceof Error ? error.message : '删除产品失败';
      toast.error(errorMessage);
    }
  };

  // 添加尺寸输入框
  const addDimensionInput = () => {
    setNewProduct(prev => ({
      ...prev,
      availableDimensions: [...prev.availableDimensions, '']
    }));
  };

  // 添加颜色输入框
  const addColorInput = () => {
    setNewProduct(prev => ({
      ...prev,
      availableColors: [...prev.availableColors, '']
    }));
  };

  // 添加特色输入框
  const addFeatureInput = () => {
    setNewProduct(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="mb-8 h-8 w-48 rounded bg-gray-200" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-8 w-1/2 rounded bg-gray-200" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题和操作 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回管理后台
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-2xl text-gray-900">产品管理</h1>
              <p className="text-gray-600">管理产品信息和库存</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link href="/admin/products/upload">
              <Button variant="outline">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                批量上传
              </Button>
            </Link>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  添加产品
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>添加新产品</DialogTitle>
                </DialogHeader>
                
                <div className="max-h-96 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="productCode">产品编码 *</Label>
                      <Input
                        id="productCode"
                        value={newProduct.productCode}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, productCode: e.target.value }))}
                        placeholder="输入产品编码"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">产品类别</Label>
                      <Select value={newProduct.category} onValueChange={(value: ProductCategory) => setNewProduct(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="岩点">岩点</SelectItem>
                          <SelectItem value="攀岩板材">攀岩板材</SelectItem>
                          <SelectItem value="五金配件">五金配件</SelectItem>
                          <SelectItem value="复合板">复合板</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">单价 (元) *</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProduct.unitPrice}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weight">重量 (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0"
                        step="0.1"
                        value={newProduct.weight}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">产品图片URL</Label>
                    <Input
                      id="image"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>可选尺寸</Label>
                    {newProduct.availableDimensions.map((dimension, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={dimension}
                          onChange={(e) => {
                            const newDimensions = [...newProduct.availableDimensions];
                            newDimensions[index] = e.target.value;
                            setNewProduct(prev => ({ ...prev, availableDimensions: newDimensions }));
                          }}
                          placeholder="输入尺寸"
                        />
                        {newProduct.availableDimensions.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newDimensions = newProduct.availableDimensions.filter((_, i) => i !== index);
                              setNewProduct(prev => ({ ...prev, availableDimensions: newDimensions }));
                            }}
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addDimensionInput}>
                      添加尺寸
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>可选颜色</Label>
                    {newProduct.availableColors.map((color, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={color}
                          onChange={(e) => {
                            const newColors = [...newProduct.availableColors];
                            newColors[index] = e.target.value;
                            setNewProduct(prev => ({ ...prev, availableColors: newColors }));
                          }}
                          placeholder="输入颜色"
                        />
                        {newProduct.availableColors.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newColors = newProduct.availableColors.filter((_, i) => i !== index);
                              setNewProduct(prev => ({ ...prev, availableColors: newColors }));
                            }}
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addColorInput}>
                      添加颜色
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumOrderQty">最小订购数量</Label>
                    <Input
                      id="minimumOrderQty"
                      type="number"
                      min="1"
                      value={newProduct.minimumOrderQty}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, minimumOrderQty: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">产品描述</Label>
                    <Textarea
                      id="remarks"
                      value={newProduct.remarks}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="输入产品描述"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applications">应用场景</Label>
                    <Textarea
                      id="applications"
                      value={newProduct.applications}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, applications: e.target.value }))}
                      placeholder="输入应用场景描述"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateProduct}>
                    创建产品
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 产品列表 */}
        <Card>
          <CardHeader>
            <CardTitle>产品列表 ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-700">
                  <tr>
                    <th className="py-3">产品编码</th>
                    <th className="py-3">图片</th>
                    <th className="py-3">类别</th>
                    <th className="py-3">价格</th>
                    <th className="py-3">重量</th>
                    <th className="py-3">状态</th>
                    <th className="py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="py-3 font-medium">{product.productCode}</td>
                      <td className="py-3">
                        {product.image ? (
                          <img src={product.image} alt={product.productCode} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3">{product.category}</td>
                      <td className="py-3">{formatPrice(product.unitPrice)}</td>
                      <td className="py-3">{product.weight}kg</td>
                      <td className="py-3">
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? '启用' : '禁用'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/products/edit?id=${product.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleProductStatus(product.id, product.isActive)}
                              disabled={togglingProductId === product.id}
                            >
                              {product.isActive ? (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  禁用
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  启用
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {products.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  暂无产品数据，点击"添加产品"开始添加
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 