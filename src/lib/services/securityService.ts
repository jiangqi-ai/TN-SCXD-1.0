// 安全服务 - 处理IP限制和防暴力破解
interface LoginAttempt {
  ip: string;
  timestamp: number;
  success: boolean;
}

interface UserSession {
  userId: string;
  ip: string;
  loginTime: number;
  lastActivity: number;
}

interface IPBlockInfo {
  ip: string;
  blockUntil: number;
  attemptCount: number;
}

class SecurityService {
  private readonly STORAGE_KEYS = {
    LOGIN_ATTEMPTS: 'tn-scxd-login-attempts',
    USER_SESSIONS: 'tn-scxd-user-sessions',
    BLOCKED_IPS: 'tn-scxd-blocked-ips'
  };

  // 安全配置
  private readonly CONFIG = {
    MAX_LOGIN_ATTEMPTS: 5,           // 最大登录尝试次数
    BLOCK_DURATION: 15 * 60 * 1000,  // 阻止时间：15分钟
    ATTEMPT_WINDOW: 5 * 60 * 1000,   // 尝试窗口：5分钟
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 会话超时：24小时
  };

  /**
   * 获取客户端IP地址（模拟）
   */
  private getClientIP(): string {
    // 在真实环境中，这会从请求头中获取真实IP
    // 这里使用localStorage模拟客户端标识
    if (typeof window === 'undefined') return 'server-side';
    
    let clientId = localStorage.getItem('client-id');
    if (!clientId) {
      clientId = 'client-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('client-id', clientId);
    }
    return clientId;
  }

  /**
   * 获取登录尝试记录
   */
  private getLoginAttempts(): LoginAttempt[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(this.STORAGE_KEYS.LOGIN_ATTEMPTS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * 保存登录尝试记录
   */
  private saveLoginAttempts(attempts: LoginAttempt[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
  }

  /**
   * 获取用户会话记录
   */
  private getUserSessions(): UserSession[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(this.STORAGE_KEYS.USER_SESSIONS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * 保存用户会话记录
   */
  private saveUserSessions(sessions: UserSession[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEYS.USER_SESSIONS, JSON.stringify(sessions));
  }

  /**
   * 获取被阻止的IP列表
   */
  private getBlockedIPs(): IPBlockInfo[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(this.STORAGE_KEYS.BLOCKED_IPS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * 保存被阻止的IP列表
   */
  private saveBlockedIPs(blockedIPs: IPBlockInfo[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEYS.BLOCKED_IPS, JSON.stringify(blockedIPs));
  }

  /**
   * 清理过期的登录尝试记录
   */
  private cleanupOldAttempts(): void {
    const attempts = this.getLoginAttempts();
    const now = Date.now();
    const validAttempts = attempts.filter(
      attempt => now - attempt.timestamp < this.CONFIG.ATTEMPT_WINDOW
    );
    this.saveLoginAttempts(validAttempts);
  }

  /**
   * 清理过期的IP阻止记录
   */
  private cleanupBlockedIPs(): void {
    const blockedIPs = this.getBlockedIPs();
    const now = Date.now();
    const activeBlocks = blockedIPs.filter(block => now < block.blockUntil);
    this.saveBlockedIPs(activeBlocks);
  }

  /**
   * 清理过期的用户会话
   */
  private cleanupExpiredSessions(): void {
    const sessions = this.getUserSessions();
    const now = Date.now();
    const activeSessions = sessions.filter(
      session => now - session.lastActivity < this.CONFIG.SESSION_TIMEOUT
    );
    this.saveUserSessions(activeSessions);
  }

  /**
   * 检查IP是否被阻止
   */
  public isIPBlocked(ip?: string): boolean {
    this.cleanupBlockedIPs();
    const clientIP = ip || this.getClientIP();
    const blockedIPs = this.getBlockedIPs();
    const block = blockedIPs.find(b => b.ip === clientIP);
    return block ? Date.now() < block.blockUntil : false;
  }

  /**
   * 获取IP阻止剩余时间（分钟）
   */
  public getBlockTimeRemaining(ip?: string): number {
    const clientIP = ip || this.getClientIP();
    const blockedIPs = this.getBlockedIPs();
    const block = blockedIPs.find(b => b.ip === clientIP);
    if (!block || Date.now() >= block.blockUntil) return 0;
    return Math.ceil((block.blockUntil - Date.now()) / (60 * 1000));
  }

  /**
   * 检查用户是否已在其他IP登录
   */
  public checkUserSession(userId: string): { 
    hasActiveSession: boolean; 
    sessionIP?: string; 
    sessionTime?: number 
  } {
    this.cleanupExpiredSessions();
    const sessions = this.getUserSessions();
    const clientIP = this.getClientIP();
    
    const existingSession = sessions.find(s => s.userId === userId);
    
    if (existingSession && existingSession.ip !== clientIP) {
      return {
        hasActiveSession: true,
        sessionIP: existingSession.ip,
        sessionTime: existingSession.loginTime
      };
    }
    
    return { hasActiveSession: false };
  }

  /**
   * 记录登录尝试
   */
  public recordLoginAttempt(success: boolean, ip?: string): void {
    this.cleanupOldAttempts();
    const clientIP = ip || this.getClientIP();
    const attempts = this.getLoginAttempts();
    
    attempts.push({
      ip: clientIP,
      timestamp: Date.now(),
      success
    });
    
    this.saveLoginAttempts(attempts);
    
    // 如果登录失败，检查是否需要阻止IP
    if (!success) {
      this.checkAndBlockIP(clientIP);
    }
  }

  /**
   * 检查并阻止IP
   */
  private checkAndBlockIP(ip: string): void {
    const attempts = this.getLoginAttempts();
    const recentFailedAttempts = attempts.filter(
      attempt => 
        attempt.ip === ip && 
        !attempt.success &&
        Date.now() - attempt.timestamp < this.CONFIG.ATTEMPT_WINDOW
    );
    
    if (recentFailedAttempts.length >= this.CONFIG.MAX_LOGIN_ATTEMPTS) {
      const blockedIPs = this.getBlockedIPs();
      const existingBlock = blockedIPs.find(b => b.ip === ip);
      
      if (existingBlock) {
        // 延长阻止时间
        existingBlock.blockUntil = Date.now() + this.CONFIG.BLOCK_DURATION;
        existingBlock.attemptCount += 1;
      } else {
        // 添加新的阻止记录
        blockedIPs.push({
          ip,
          blockUntil: Date.now() + this.CONFIG.BLOCK_DURATION,
          attemptCount: 1
        });
      }
      
      this.saveBlockedIPs(blockedIPs);
    }
  }

  /**
   * 创建用户会话
   */
  public createUserSession(userId: string, ip?: string): void {
    this.cleanupExpiredSessions();
    const clientIP = ip || this.getClientIP();
    const sessions = this.getUserSessions();
    
    // 移除该用户的其他会话
    const filteredSessions = sessions.filter(s => s.userId !== userId);
    
    // 添加新会话
    filteredSessions.push({
      userId,
      ip: clientIP,
      loginTime: Date.now(),
      lastActivity: Date.now()
    });
    
    this.saveUserSessions(filteredSessions);
  }

  /**
   * 更新会话活动时间
   */
  public updateSessionActivity(userId: string): void {
    const sessions = this.getUserSessions();
    const session = sessions.find(s => s.userId === userId);
    if (session) {
      session.lastActivity = Date.now();
      this.saveUserSessions(sessions);
    }
  }

  /**
   * 移除用户会话
   */
  public removeUserSession(userId: string): void {
    const sessions = this.getUserSessions();
    const filteredSessions = sessions.filter(s => s.userId !== userId);
    this.saveUserSessions(filteredSessions);
  }

  /**
   * 强制踢出用户（管理员功能）
   */
  public forceLogoutUser(userId: string): void {
    this.removeUserSession(userId);
  }

  /**
   * 获取当前活跃会话统计
   */
  public getActiveSessionsStats(): {
    totalSessions: number;
    sessionsByIP: { [ip: string]: number };
  } {
    this.cleanupExpiredSessions();
    const sessions = this.getUserSessions();
    
    const sessionsByIP: { [ip: string]: number } = {};
    sessions.forEach(session => {
      sessionsByIP[session.ip] = (sessionsByIP[session.ip] || 0) + 1;
    });
    
    return {
      totalSessions: sessions.length,
      sessionsByIP
    };
  }

  /**
   * 清理所有安全数据（调试用）
   */
  public clearAllSecurityData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEYS.LOGIN_ATTEMPTS);
    localStorage.removeItem(this.STORAGE_KEYS.USER_SESSIONS);
    localStorage.removeItem(this.STORAGE_KEYS.BLOCKED_IPS);
  }

  /**
   * 获取安全统计信息
   */
  public getSecurityStats(): {
    blockedIPs: number;
    activeAttempts: number;
    activeSessions: number;
  } {
    this.cleanupOldAttempts();
    this.cleanupBlockedIPs();
    this.cleanupExpiredSessions();
    
    return {
      blockedIPs: this.getBlockedIPs().length,
      activeAttempts: this.getLoginAttempts().length,
      activeSessions: this.getUserSessions().length
    };
  }
}

export const securityService = new SecurityService(); 