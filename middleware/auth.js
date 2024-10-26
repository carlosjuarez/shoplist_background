const jwt = require('jsonwebtoken');
const User = require('../models/user');


const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token) return res.status(401).send('Access denied, no token provided');

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const username = decoded.username;

        const user = await User.findOne({username});
        if(!user) return res.status(404).send("User not found");
        req.user = user;
        next();
    }catch(error){
        return res.status(403).send('Invalid token');
    }
};

module.exports = authenticateToken;