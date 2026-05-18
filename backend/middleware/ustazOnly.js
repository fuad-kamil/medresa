const ustazOnly = (req, res, next) => {
    if (req.user.role !== 'ustaz') {
        return res.status(403).json({
            message: 'Access denied. Ustaz only.'
        })
    }

    next()
}

export default ustazOnly