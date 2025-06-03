'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, Package, LogOut, Settings, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';

export default function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('已退出登录');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">攀岩定制系统</h1>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-primary transition-colors">
              产品中心
            </Link>
            {isAuthenticated && (
              <Link href="/orders" className="text-gray-700 hover:text-primary transition-colors">
                我的订单
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-gray-700 hover:text-primary transition-colors">
                管理后台
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* 购物车 */}
                <Link href="/cart" className="relative">
                  <Button variant="outline" size="sm">
                    <ShoppingCart className="h-4 w-4" />
                    {getTotalItems() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {getTotalItems()}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* 用户中心下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      {user?.profile.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {user?.profile.name}
                    </div>
                    <div className="px-2 py-1.5 text-xs text-gray-500">
                      {user?.email}
                    </div>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        我的订单
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/cart" className="w-full">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        购物车 {getTotalItems() > 0 && `(${getTotalItems()})`}
                      </Link>
                    </DropdownMenuItem>

                    {user?.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            管理后台
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button>登录</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 