import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types';
import { mockAuthService } from '@/lib/services/mockDataService';
import { securityService } from '@/lib/services/securityService';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const user = await mockAuthService.login(credentials);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          toast.success('登录成功');
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : '登录失败';
          toast.error(message);
          throw error;
        }
      },
      
      logout: async () => {
        const currentUser = get().user;
        if (currentUser) {
          try {
            await mockAuthService.logout(currentUser.id);
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        
        set({ 
          user: null, 
          isAuthenticated: false 
        });
        toast.success('已退出登录');
      },
      
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const user = await mockAuthService.register(userData);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          toast.success('注册成功');
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : '注册失败';
          toast.error(message);
          throw error;
        }
      },
      
      updateProfile: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) {
          toast.error('用户未登录');
          throw new Error('用户未登录');
        }
        
        try {
          const updatedUser = await mockAuthService.updateProfile(currentUser.id, updates);
          set({ user: updatedUser });
          toast.success('个人信息已更新');
        } catch (error) {
          const message = error instanceof Error ? error.message : '更新失败';
          toast.error(message);
          throw error;
        }
      },
      
      checkAuth: async () => {
        const currentUser = get().user;
        if (currentUser) {
          try {
            const isValid = await mockAuthService.validateToken(currentUser.id);
            if (!isValid) {
              set({ 
                user: null, 
                isAuthenticated: false 
              });
              toast.error('登录会话已失效，请重新登录');
            } else {
              set({ isAuthenticated: true });
            }
          } catch (error) {
            set({ 
              user: null, 
              isAuthenticated: false 
            });
            toast.error('验证失败，请重新登录');
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
); 