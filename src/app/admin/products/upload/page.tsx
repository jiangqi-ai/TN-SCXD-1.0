'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockProductService } from '@/lib/services/mockDataService';
import { parseColors, validateNumber, validateProductCode } from '@/lib/utils/helpers';
import type { Product, ExcelProductRow } from '@/types';
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
        '图片': '',
        '可选尺寸': '20cm x 15cm x 10cm, 30cm x 30cm x 5cm',
        '重量': 0.8,
        '包含个数': 50,
        '订单数量': 10,
        '颜色': '白色, 牛皮色, 黑色',
        '销售价格（不含运，不含税）': 85.00,
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
            const availableDimensions = parseColors((row as any)['可选尺寸'] || '');
            const product: Product = {
              id: `imported-${Date.now()}-${index}`,
              productCode: validateProductCode(row['产品编号'], index),
              image: row['图片'] || '',
              availableDimensions,
              weight: validateNumber(row['重量'], '重量', index),
              pieceCount: validateNumber(row['包含个数'], '包含个数', index),
              minimumOrderQty: validateNumber(row['订单数量'], '订单数量', index),
              availableColors: parseColors(row['颜色']),
              unitPrice: validateNumber(row['销售价格（不含运，不含税）'], '销售价格', index),
              remarks: row['备注'] || '',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            // 验证必填字段
            if (product.availableDimensions.length === 0) {
              throw new Error(`第 ${index + 2} 行产品尺寸不能为空`);
            }
            if (product.availableColors.length === 0) {
              throw new Error(`第 ${index + 2} 行颜色不能为空`);
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

      await mockProductService.uploadFromExcel(parsedData);
      
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回管理后台
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">产品批量上传</h1>
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
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center ${currentStep === 'preview' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`rounded-full p-2 ${currentStep === 'preview' ? 'bg-primary text-white' : 'bg-gray-200'}`}>2</div>
              <span className="ml-2">预览数据</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
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
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
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
                      <Upload className="h-4 w-4 mr-2" />
                      选择文件
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-gray-500">或</span>
                  </div>
                  
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    下载Excel模板
                  </Button>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <h4 className="font-medium text-red-800">发现错误</h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-800">注意事项</h4>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
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
              <div className="flex justify-between items-center">
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
                      <th className="text-left p-2">产品编号</th>
                      <th className="text-left p-2">尺寸</th>
                      <th className="text-left p-2">重量</th>
                      <th className="text-left p-2">个数</th>
                      <th className="text-left p-2">起订量</th>
                      <th className="text-left p-2">颜色</th>
                      <th className="text-left p-2">价格</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{product.productCode}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-center text-gray-500 mt-4">
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
            <CardContent className="text-center space-y-4">
              <Upload className="h-16 w-16 text-primary mx-auto animate-pulse" />
              <p className="text-gray-600">正在上传产品数据，请稍候...</p>
              <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-gray-500">{uploadProgress}%</p>
            </CardContent>
          </Card>
        )}

        {/* 完成步骤 */}
        {currentStep === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle>上传完成</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
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