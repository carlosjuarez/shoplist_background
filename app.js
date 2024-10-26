require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const app = express();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const shoplistRoutes = require('./routes/shoplist');
const authenticateToken = require('./middleware/auth');
const Shoplist = require('./models/shoplist');
                    
app.use(express.json());

connectDB();

app.use('/users', authRoutes);
app.use('/products', productRoutes);
app.use('/shoplists', shoplistRoutes);

app.get('/protected', authenticateToken, (req,res) => {
    res.status(200).send(`Hello, ${req.user.username}, you have access to this route`);
});

app.get('/', (req,res)=>{
    res.send('Shoplist Backend API');
});

module.exports = app;