'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  CUSTOMER_TYPES, 
  PRODUCT_CATEGORIES, 
  getDefaultDiscountRange, 
  getSubCategories, 
  isValidCategory, 
  isValidCustomerType,
  isValidSubCategory 
} from '@/lib/constants/productCategories';
import { productService } from '@/lib/services/productService';
import { generateId, parseColors, validateNumber, validateProductCode } from '@/lib/utils/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import type { CustomerType, ExcelProductRow, Product, ProductCategory, ProductSubCategory } from '@/types';
import { AlertCircle, ArrowLeft, CheckCircle, Download, FileText, Upload, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function ProductUploadPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<Product[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'preview' | 'uploading' | 'complete'>('select');

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

  const downloadTemplate = () => {
    const templateData = [
      {
        '产品编号': 'BOX-001',
        '主分类': '攀岩板材',
        '子分类': '高密度攀岩板',
        '目标客户': 'OEM,品牌客户',
        '图片': '',
        '可选尺寸': '20cm x 15cm x 10cm, 30cm x 30cm x 5cm',
        '重量': 0.8,
        '包含个数': 50,
        '订单数量': 10,
        '颜色': '白色, 牛皮色, 黑色',
        '销售价格（不含运，不含税）': 85.00,
        '可打折': '是',
        '最大折扣(%)': 15,
        '备注': '示例产品说明'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '产品模板');
    XLSX.writeFile(workbook, '产品批量上传模板.xlsx');
    toast.success('模板下载成功');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('请选择Excel文件（.xlsx或.xls格式）');
      return;
    }

    parseExcelFile(file);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          toast.error('文件读取失败');
          return;
        }
        
        const data = new Uint8Array(result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          toast.error('Excel文件没有工作表');
          setErrors(['Excel文件没有工作表']);
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          toast.error('无法读取Excel工作表');
          setErrors(['无法读取Excel工作表']);
          return;
        }
        const jsonData: ExcelProductRow[] = XLSX.utils.sheet_to_json(worksheet);

        const products: Product[] = [];
        const newErrors: string[] = [];

        jsonData.forEach((row, index) => {
          try {
            // 验证主分类
            const categoryStr = (row as any)['主分类'] || '';
            if (!categoryStr) {
              throw new Error(`第 ${index + 2} 行主分类不能为空`);
            }
            if (!isValidCategory(categoryStr)) {
              throw new Error(`第 ${index + 2} 行主分类"${categoryStr}"无效。有效值：${PRODUCT_CATEGORIES.join(', ')}`);
            }
            const category = categoryStr as ProductCategory;

            // 验证子分类（如果有子分类的话）
            const subCategoryStr = (row as any)['子分类'] || '';
            let subCategory: ProductSubCategory | undefined;
            if (subCategoryStr) {
              const validSubCategories = getSubCategories(category);
              if (validSubCategories.length > 0 && !isValidSubCategory(category, subCategoryStr)) {
                throw new Error(`第 ${index + 2} 行子分类"${subCategoryStr}"无效。有效值：${validSubCategories.join(', ')}`);
              }
              subCategory = subCategoryStr as ProductSubCategory;
            }

            // 验证目标客户
            const targetCustomersStr = (row as any)['目标客户'] || '';
            const targetCustomers: CustomerType[] = [];
            if (targetCustomersStr) {
              const customerList = targetCustomersStr.split(',').map((c: string) => c.trim());
              for (const customerType of customerList) {
                if (!isValidCustomerType(customerType)) {
                  throw new Error(`第 ${index + 2} 行目标客户"${customerType}"无效。有效值：${CUSTOMER_TYPES.join(', ')}`);
                }
                targetCustomers.push(customerType as CustomerType);
              }
            }

            // 验证折扣设置
            const discountableStr = (row as any)['可打折'] || '';
            const discountable = discountableStr === '是' || discountableStr === 'true' || discountableStr === '1';
            
            let maxDiscount = 0;
            if (discountable) {
              const maxDiscountStr = (row as any)['最大折扣(%)'] || '';
              if (maxDiscountStr) {
                maxDiscount = validateNumber(maxDiscountStr, '最大折扣', index);
                if (maxDiscount < 0 || maxDiscount > 100) {
                  throw new Error(`第 ${index + 2} 行最大折扣必须在0-100之间`);
                }
              } else {
                // 使用默认折扣范围
                const defaultRange = getDefaultDiscountRange(category);
                maxDiscount = defaultRange.max;
              }
            }

            const availableDimensions = parseColors((row as any)['可选尺寸'] || '');
            const product: Product = {
              id: generateId(),
              productCode: validateProductCode(row['产品编号'], index),
              image: row['图片'] || '',
              availableDimensions,
              weight: validateNumber(row['重量'], '重量', index),
              pieceCount: validateNumber(row['包含个数'], '包含个数', index),
              minimumOrderQty: validateNumber(row['订单数量'], '订单数量', index),
              availableColors: parseColors(row['颜色']),
              unitPrice: validateNumber(row['销售价格（不含运，不含税）'], '销售价格', index),
              remarks: row['备注'] || '',
              features: [],
              applications: '',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              // 新增字段
              category,
              subCategory: subCategory!,
              targetCustomers,
              discountable,
              maxDiscount
            };

            // 验证必填字段
            if (product.availableDimensions.length === 0) {
              throw new Error(`第 ${index + 2} 行产品尺寸不能为空`);
            }
            if (product.availableColors.length === 0) {
              throw new Error(`第 ${index + 2} 行颜色不能为空`);
            }
            if (product.targetCustomers.length === 0) {
              throw new Error(`第 ${index + 2} 行目标客户不能为空`);
            }

            products.push(product);
          } catch (error) {
            newErrors.push((error as Error).message);
          }
        });

        setParsedData(products);
        setErrors(newErrors);
        setCurrentStep(newErrors.length === 0 ? 'preview' : 'select');
        
        if (newErrors.length === 0) {
          toast.success(`成功解析 ${products.length} 个产品`);
        } else {
          toast.error(`解析失败，发现 ${newErrors.length} 个错误`);
        }
      } catch (error) {
        console.error('Failed to parse Excel file:', error);
        toast.error('文件解析失败，请检查文件格式');
        setErrors(['文件解析失败，请检查文件格式是否正确']);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    setCurrentStep('uploading');
    setUploadProgress(0);

    try {
      // 模拟上传进度
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

              await productService.uploadFromExcel(parsedData);
      
      setCurrentStep('complete');
      toast.success('产品批量上传成功！');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('上传失败，请重试');
      setCurrentStep('preview');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setParsedData([]);
    setErrors([]);
    setCurrentStep('select');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
          <h1 className="mb-4 font-bold text-3xl text-gray-900">产品批量上传</h1>
          <p className="text-gray-600">
            通过Excel文件批量导入产品数据
          </p>
        </div>

        {/* 上传步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'select' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`rounded-full p-2 ${currentStep === 'select' ? 'bg-primary text-white' : 'bg-gray-200'}`}>1</div>
              <span className="ml-2">选择文件</span>
            </div>
            <div className="h-px flex-1 bg-gray-300"></div>
            <div className={`flex items-center ${currentStep === 'preview' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`rounded-full p-2 ${currentStep === 'preview' ? 'bg-primary text-white' : 'bg-gray-200'}`}>2</div>
              <span className="ml-2">预览数据</span>
            </div>
            <div className="h-px flex-1 bg-gray-300"></div>
            <div className={`flex items-center ${currentStep === 'uploading' || currentStep === 'complete' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`rounded-full p-2 ${currentStep === 'uploading' || currentStep === 'complete' ? 'bg-primary text-white' : 'bg-gray-200'}`}>3</div>
              <span className="ml-2">上传完成</span>
            </div>
          </div>
        </div>

        {/* 文件选择步骤 */}
        {currentStep === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle>第一步：选择Excel文件</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Upload className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <p className="mb-4 text-gray-600">
                  请选择包含产品数据的Excel文件（支持.xlsx和.xls格式）
                </p>
                
                <div className="space-y-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      选择文件
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-gray-500">或</span>
                  </div>
                  
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    下载Excel模板
                  </Button>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 flex items-center">
                    <XCircle className="mr-2 h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-red-800">发现错误</h4>
                  </div>
                  <ul className="list-inside list-disc space-y-1 text-red-700 text-sm">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">注意事项</h4>
                </div>
                <ul className="list-inside list-disc space-y-1 text-blue-700 text-sm">
                  <li>Excel文件必须包含指定的列名</li>
                  <li>产品编号不能重复且不能为空</li>
                  <li>数值字段（重量、个数、价格等）必须为有效数字</li>
                  <li>颜色字段用逗号分隔多个颜色</li>
                  <li>建议先下载模板查看格式要求</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据预览步骤 */}
        {currentStep === 'preview' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>第二步：预览数据</CardTitle>
                <div className="space-x-2">
                  <Button variant="outline" onClick={resetUpload}>
                    重新选择
                  </Button>
                  <Button onClick={handleUpload}>
                    确认上传 ({parsedData.length} 个产品)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">产品编号</th>
                      <th className="p-2 text-left">分类</th>
                      <th className="p-2 text-left">目标客户</th>
                      <th className="p-2 text-left">尺寸</th>
                      <th className="p-2 text-left">重量</th>
                      <th className="p-2 text-left">个数</th>
                      <th className="p-2 text-left">起订量</th>
                      <th className="p-2 text-left">颜色</th>
                      <th className="p-2 text-left">价格</th>
                      <th className="p-2 text-left">折扣</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{product.productCode}</td>
                        <td className="p-2">
                          <div>
                            <Badge variant="outline" className="mb-1 text-xs">
                              {product.category}
                            </Badge>
                            {product.subCategory && (
                              <div>
                                <Badge variant="secondary" className="text-xs">
                                  {product.subCategory}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {product.targetCustomers.map(customer => (
                              <Badge key={customer} variant="outline" className="text-xs">
                                {customer}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-2">{product.availableDimensions}</td>
                        <td className="p-2">{product.weight}kg</td>
                        <td className="p-2">{product.pieceCount}</td>
                        <td className="p-2">{product.minimumOrderQty}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {product.availableColors.map(color => (
                              <Badge key={color} variant="secondary" className="text-xs">
                                {color}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-2">¥{product.unitPrice}</td>
                        <td className="p-2">
                          {product.discountable ? (
                            <Badge variant="default" className="text-xs">
                              最高{product.maxDiscount}%
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              不可打折
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="mt-4 text-center text-gray-500">
                    还有 {parsedData.length - 10} 个产品未显示...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 上传进度步骤 */}
        {currentStep === 'uploading' && (
          <Card>
            <CardHeader>
              <CardTitle>第三步：正在上传</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <Upload className="mx-auto h-16 w-16 animate-pulse text-primary" />
              <p className="text-gray-600">正在上传产品数据，请稍候...</p>
              <Progress value={uploadProgress} className="mx-auto w-full max-w-md" />
              <p className="text-gray-500 text-sm">{uploadProgress}%</p>
            </CardContent>
          </Card>
        )}

        {/* 完成步骤 */}
        {currentStep === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle>上传完成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
              <p className="text-gray-600">
                成功上传 {parsedData.length} 个产品！
              </p>
              <div className="space-x-3">
                <Button onClick={resetUpload}>
                  继续上传
                </Button>
                <Link href="/admin">
                  <Button variant="outline">
                    返回管理后台
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 