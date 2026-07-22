import jwt from 'jsonwebtoken'

// Protect route middleware
const protect = (req, res, next) => {
    let token

    // 1. Try to extract from HTTP cookies
    if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.split('=').map(c => c.trim());
            acc[key] = value;
            return acc;
        }, {});
        if (cookies.token) {
            token = cookies.token;
        }
    }

    // 2. Fallback to Authorization Bearer header
    if (
        !token &&
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return res.status(401).json({
            message: 'Not authorized, no token'
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()
    } catch (error) {
        return res.status(401).json({
            message: 'Not authorized, token failed'
        })
    }
}

export default protect