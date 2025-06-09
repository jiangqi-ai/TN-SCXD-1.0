'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { productService } from '@/lib/services/hybridProductService';
import { formatPrice } from '@/lib/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import type { Product } from '@/types';
import { ArrowLeft, Edit, ImageIcon, Package, Search, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function ProductEditPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 预定义的尺寸选项
  const dimensionOptions = [
    '20cm x 15cm x 10cm',
    '25cm x 25cm x 4cm', 
    '30cm x 30cm x 5cm',
    '35cm x 35cm x 6cm',
    '40cm x 30cm x 20cm',
    '50cm x 40cm x 30cm'
  ];

  // 检查权限 - 在useEffect中进行
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/admin');
      return;
    }
  }, [isAuthenticated, user, router]);

  // 如果权限验证失败，显示加载状态
  if (!isAuthenticated || user?.role !== 'admin') {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    // 只有通过权限验证才加载产品
    if (!isAuthenticated || user?.role !== 'admin') {
      return;
    }

    const loadProducts = async () => {
      try {
        const data = await productService.getAllForAdmin();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('加载产品失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [isAuthenticated, user]);

  // 搜索筛选
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.availableDimensions.some(dimension => 
          dimension.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchTerm]);

  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsDialogOpen(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingProduct) {
      // 在实际项目中，这里会上传到云存储
      // 现在我们使用FileReader创建一个本地预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditingProduct({
          ...editingProduct,
          image: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
      toast.success('图片上传成功');
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
              const updatedProduct = await productService.update(editingProduct.id, editingProduct);
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      setIsDialogOpen(false);
      setEditingProduct(null);
      toast.success('产品更新成功');
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('更新失败，请重试');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;

    try {
              await productService.delete(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('产品已删除');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('删除失败，请重试');
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="relative mb-3 aspect-square rounded-lg bg-gray-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.productCode}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <ImageIcon className="h-12 w-12" />
            </div>
          )}
        </div>
        <CardTitle className="text-lg">{product.productCode}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-gray-600 text-sm">
          <p>尺寸: {product.availableDimensions.join(', ')}</p>
          <p>重量: {product.weight}kg</p>
          <p>包含: {product.pieceCount}个</p>
          <p>起订: {product.minimumOrderQty}件</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {product.availableColors.map(color => (
              <Badge key={color} variant="secondary" className="text-xs">
                {color}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-4 border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-lg text-primary">
              {formatPrice(product.unitPrice)}
            </p>
            <Badge variant={product.isActive ? 'default' : 'secondary'}>
              {product.isActive ? '启用' : '禁用'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(product)}
              className="flex-1"
            >
              <Edit className="mr-1 h-4 w-4" />
              编辑
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(product.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回管理后台
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-4 font-bold text-3xl text-gray-900">产品编辑</h1>
          <p className="text-gray-600">
            管理和编辑产品信息
          </p>
        </div>

        {/* 搜索栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
              <Input
                placeholder="搜索产品编号或尺寸..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 产品列表 */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 font-semibold text-gray-900 text-xl">
              {searchTerm ? '没有找到产品' : '暂无产品'}
            </h3>
            <p className="mb-6 text-gray-600">
              {searchTerm ? '没有找到符合条件的产品' : '还没有添加任何产品'}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                清除搜索
              </Button>
            )}
          </div>
        )}

        {/* 编辑对话框 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑产品</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <div className="space-y-4">
                {/* 产品图片 */}
                <div>
                  <Label>产品图片</Label>
                  <div className="mt-2">
                    <div className="relative mb-3 aspect-square h-32 w-32 rounded-lg bg-gray-100">
                      {editingProduct.image ? (
                        <img
                          src={editingProduct.image}
                          alt="产品图片"
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        上传图片
                      </Button>
                      <p className="text-gray-500 text-xs">
                        支持 JPG、PNG 格式，建议尺寸 800x800px
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="productCode">产品编号</Label>
                  <Input
                    id="productCode"
                    value={editingProduct.productCode}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      productCode: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="dimensions">可选尺寸（用逗号分隔）</Label>
                  <Input
                    id="dimensions"
                    value={editingProduct.availableDimensions.join(',')}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      availableDimensions: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                    })}
                    placeholder="例如：20cm x 15cm x 10cm, 30cm x 30cm x 5cm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">重量 (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={editingProduct.weight}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        weight: Number.parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pieceCount">包含个数</Label>
                    <Input
                      id="pieceCount"
                      type="number"
                      value={editingProduct.pieceCount}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        pieceCount: Number.parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minimumOrderQty">起订数量</Label>
                    <Input
                      id="minimumOrderQty"
                      type="number"
                      value={editingProduct.minimumOrderQty}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        minimumOrderQty: Number.parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitPrice">单价</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={editingProduct.unitPrice}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        unitPrice: Number.parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="colors">可选颜色（用逗号分隔）</Label>
                  <Input
                    id="colors"
                    value={editingProduct.availableColors.join(',')}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      availableColors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="features">产品特点（用逗号分隔）</Label>
                  <Input
                    id="features"
                    value={editingProduct.features?.join(',') || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      features: e.target.value.split(',').map(f => f.trim()).filter(Boolean)
                    })}
                    placeholder="例如：高强度材料，精密加工，质量上乘"
                  />
                </div>

                <div>
                  <Label htmlFor="applications">适用场景</Label>
                  <Textarea
                    id="applications"
                    value={editingProduct.applications || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      applications: e.target.value
                    })}
                    placeholder="描述产品的适用场景和应用范围"
                  />
                </div>

                <div>
                  <Label htmlFor="remarks">备注</Label>
                  <Textarea
                    id="remarks"
                    value={editingProduct.remarks || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      remarks: e.target.value
                    })}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSave}>
                    保存
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 