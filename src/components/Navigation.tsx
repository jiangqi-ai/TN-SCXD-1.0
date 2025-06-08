'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { FileText, LogOut, Package, Settings, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="ml-2 font-bold text-gray-900 text-xl">攀岩定制系统</h1>
            </Link>
          </div>
          
          <nav className="hidden space-x-8 md:flex">
            <Link href="/products" className="text-gray-700 transition-colors hover:text-primary">
              产品中心
            </Link>
            {isAuthenticated && (
              <Link href="/orders" className="text-gray-700 transition-colors hover:text-primary">
                我的订单
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-gray-700 transition-colors hover:text-primary">
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
                      <Badge className="-top-2 -right-2 absolute flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                        {getTotalItems()}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* 用户中心下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      {user?.profile.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 font-medium text-sm">
                      {user?.profile.name}
                    </div>
                    <div className="px-2 py-1.5 text-gray-500 text-xs">
                      {user?.email}
                    </div>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        我的订单
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/cart" className="w-full">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        购物车 {getTotalItems() > 0 && `(${getTotalItems()})`}
                      </Link>
                    </DropdownMenuItem>

                    {user?.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="w-full">
                            <Settings className="mr-2 h-4 w-4" />
                            管理后台
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
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