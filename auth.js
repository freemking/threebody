/**
 * 认证管理模块
 * 处理用户登录状态、token管理和权限检查
 */

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.apiBase = '/api';
    }
    
    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!this.token && !!this.user;
    }
    
    /**
     * 获取当前用户信息
     */
    getUser() {
        return this.user;
    }
    
    /**
     * 获取token
     */
    getToken() {
        return this.token;
    }
    
    /**
     * 检查是否是管理员
     */
    isAdmin() {
        return this.user && this.user.role === 'admin';
    }
    
    /**
     * 获取认证头
     */
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
    
    /**
     * 登录
     */
    async login(phone, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.token = data.data.token;
                this.user = data.data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, message: '网络错误，请稍后重试' };
        }
    }
    
    /**
     * 登出（跳转到登录页）
     */
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
    
    /**
     * 登出（不跳转，仅清除状态）
     */
    logoutLocal() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
    
    /**
     * 验证token有效性
     */
    async verifyToken() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.user = data.data;
                localStorage.setItem('user', JSON.stringify(this.user));
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('验证token失败:', error);
            this.logout();
            return false;
        }
    }
    
    /**
     * 检查登录状态，如果未登录则跳转到登录页面
     */
    async checkAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login.html';
            return false;
        }
        
        const isValid = await this.verifyToken();
        if (!isValid) {
            window.location.href = '/login.html';
            return false;
        }
        
        return true;
    }
    
    /**
     * 发送认证请求
     */
    async authenticatedFetch(url, options = {}) {
        const headers = {
            ...options.headers,
            ...this.getAuthHeaders()
        };
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // 如果返回401或403，说明token无效
        if (response.status === 401 || response.status === 403) {
            this.logout();
            return null;
        }
        
        return response;
    }
}

// 创建全局认证管理器实例
const auth = new AuthManager();

// 导出到全局作用域
window.auth = auth;
