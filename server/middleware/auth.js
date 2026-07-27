const jwt = require('jsonwebtoken');

// JWT密钥（与 routes/auth.js 保持一致）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

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

module.exports = { authenticateToken, requireAdmin };
