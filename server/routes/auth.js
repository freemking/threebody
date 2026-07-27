const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryWithRetry } = require('../db');

// JWT密钥（实际生产环境应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = '30d';

/**
 * 生成JWT token
 */
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            phone: user.phone, 
            nickname: user.nickname, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * 验证JWT token中间件
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: '未提供认证token' 
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'token无效或已过期' 
            });
        }
        req.user = user;
        next();
    });
}

/**
 * 验证管理员权限中间件
 */
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: '需要管理员权限' 
        });
    }
    next();
}

/**
 * 用户登录
 */
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        if (!phone || !password) {
            return res.status(400).json({ 
                success: false, 
                message: '手机号和密码不能为空' 
            });
        }
        
        // 查询用户
        const [users] = await queryWithRetry(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: '手机号或密码错误' 
            });
        }
        
        const user = users[0];
        
        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: '手机号或密码错误' 
            });
        }
        
        // 生成token
        const token = generateToken(user);
        
        // 返回用户信息（不包含密码）
        const userInfo = {
            id: user.id,
            phone: user.phone,
            nickname: user.nickname,
            role: user.role
        };
        
        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: userInfo
            }
        });
        
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '登录失败，请稍后重试' 
        });
    }
});

/**
 * 获取当前用户信息
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await queryWithRetry(
            'SELECT id, phone, nickname, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }
        
        res.json({
            success: true,
            data: users[0]
        });
        
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取用户信息失败' 
        });
    }
});

/**
 * 管理员：添加用户
 */
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { phone, nickname, password, role } = req.body;
        
        if (!phone || !nickname || !password) {
            return res.status(400).json({ 
                success: false, 
                message: '手机号、昵称和密码不能为空' 
            });
        }
        
        // 检查手机号是否已存在
        const [existingUsers] = await queryWithRetry(
            'SELECT id FROM users WHERE phone = ?',
            [phone]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: '该手机号已被注册' 
            });
        }
        
        // 加密密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // 验证角色
        const userRole = (role === 'admin') ? 'admin' : 'user';
        
        // 插入用户
        const [result] = await queryWithRetry(
            'INSERT INTO users (phone, nickname, password, role) VALUES (?, ?, ?, ?)',
            [phone, nickname, hashedPassword, userRole]
        );
        
        // 为新用户创建默认的用户等级和成就记录
        await queryWithRetry(
            'INSERT INTO vocabulary_user_stats (user_id) VALUES (?)',
            [result.insertId]
        );
        
        res.json({
            success: true,
            message: '用户添加成功',
            data: {
                id: result.insertId,
                phone,
                nickname,
                role: userRole
            }
        });
        
    } catch (error) {
        console.error('添加用户失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '添加用户失败' 
        });
    }
});

/**
 * 管理员：获取用户列表
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await queryWithRetry(
            'SELECT id, phone, nickname, role, created_at FROM users ORDER BY created_at DESC'
        );
        
        res.json({
            success: true,
            data: users
        });
        
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取用户列表失败' 
        });
    }
});

/**
 * 管理员：删除用户
 */
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // 不能删除自己
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: '不能删除自己的账户' 
            });
        }
        
        // 检查用户是否存在
        const [users] = await queryWithRetry(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }
        
        // 删除用户（级联删除会自动删除相关数据）
        await queryWithRetry(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );
        
        res.json({
            success: true,
            message: '用户删除成功'
        });
        
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '删除用户失败' 
        });
    }
});

/**
 * 管理员：修改用户信息
 */
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { nickname, role } = req.body;
        
        if (!nickname) {
            return res.status(400).json({ 
                success: false, 
                message: '昵称不能为空' 
            });
        }
        
        // 检查用户是否存在
        const [users] = await queryWithRetry(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }
        
        // 验证角色
        const userRole = (role === 'admin') ? 'admin' : 'user';
        
        // 更新用户信息
        await queryWithRetry(
            'UPDATE users SET nickname = ?, role = ? WHERE id = ?',
            [nickname, userRole, userId]
        );
        
        res.json({
            success: true,
            message: '用户信息更新成功'
        });
        
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '更新用户信息失败' 
        });
    }
});

/**
 * 管理员：重置用户密码
 */
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { newPassword } = req.body;
        
        if (!newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: '新密码不能为空' 
            });
        }
        
        // 检查用户是否存在
        const [users] = await queryWithRetry(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }
        
        // 加密新密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // 更新密码
        await queryWithRetry(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );
        
        res.json({
            success: true,
            message: '密码重置成功'
        });
        
    } catch (error) {
        console.error('重置密码失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '重置密码失败' 
        });
    }
});

/**
 * 修改自己的密码
 */
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: '旧密码和新密码不能为空' 
            });
        }
        
        // 获取当前用户信息
        const [users] = await queryWithRetry(
            'SELECT id, password FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }
        
        const user = users[0];
        
        // 验证旧密码
        const isValidPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: '旧密码错误' 
            });
        }
        
        // 加密新密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // 更新密码
        await queryWithRetry(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );
        
        res.json({
            success: true,
            message: '密码修改成功'
        });
        
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '修改密码失败' 
        });
    }
});

// 导出中间件和路由
module.exports = {
    router,
    authenticateToken,
    requireAdmin
};
