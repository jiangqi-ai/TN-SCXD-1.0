import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import React from 'react';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  headerActions?: React.ReactNode;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((value, key) => value?.[key], obj);
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  headerActions,
  emptyState,
  loading = false,
  pagination = false,
  pageSize = 10
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const paginatedData = pagination 
    ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : data;
  
  const totalPages = Math.ceil(data.length / pageSize);

  if (loading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              {headerActions}
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              {headerActions}
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="py-8 text-center">
            {emptyState?.icon || <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />}
            <p className="mb-2 text-gray-600">{emptyState?.title || '暂无数据'}</p>
            {emptyState?.description && (
              <p className="mb-4 text-gray-500 text-sm">{emptyState.description}</p>
            )}
            {emptyState?.action}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {headerActions}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {/* 桌面端表格 */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={String(column.key) + index}
                      className="px-4 py-3 text-left font-medium text-gray-900 text-sm"
                      style={{ width: column.width }}
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {columns.map((column, colIndex) => (
                      <td key={String(column.key) + colIndex} className="px-4 py-3">
                        {column.render 
                          ? column.render(getNestedValue(record, String(column.key)), record, index)
                          : getNestedValue(record, String(column.key))
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 移动端卡片布局 */}
        <div className="space-y-4 p-4 md:hidden">
          {paginatedData.map((record, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              {columns.map((column, colIndex) => {
                const value = getNestedValue(record, String(column.key));
                const renderedValue = column.render 
                  ? column.render(value, record, index)
                  : value;
                
                if (!renderedValue && renderedValue !== 0) return null;
                
                return (
                  <div key={String(column.key) + colIndex} className="flex items-start justify-between">
                    <span className="mr-3 min-w-0 flex-shrink-0 font-medium text-gray-600 text-sm">
                      {column.title}:
                    </span>
                    <div className="min-w-0 flex-1 text-right text-sm">
                      {renderedValue}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 分页 */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-gray-600 text-sm">
              显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, data.length)} 条，共 {data.length} 条
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="flex items-center text-gray-600 text-sm">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 