const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Product = require('../models/product');

router.post('/', authenticateToken, async (req,res) => {
    const {name, date, type } = req.body;
    try{
        const product = new Product({name, date, type, userId: req.user._id});
        await product.save();
        res.status(201).json(product);
    }catch(error){
        res.status(500).send('Error adding product');
    }
});

router.get('/', authenticateToken, async(req, res) => {
    try{
        const products = await Product.find({ userId: req.user._id});
        res.status(200).json(products);
    }catch(error){
        res.status(500).send('Error fetching products');
    }
});

router.get('/:id', authenticateToken, async(req, res) => {
    const productId = req.params.id;
    try{
        const products = await Product.findOne({_id: productId, userId: req.user._id});
        res.status(200).json(products);
    }catch(error){
        res.status(404).send('Product not found');
    }
});



router.put('/:id', authenticateToken, async(req,res) => {
    const { name, date, type } = req.body;
    const productId = req.params.id;
    try{
        const product = await Product.findOneAndUpdate(
            {_id: productId, userId: req.user._id},
            {name, date, type},
            {new: true}
        );
        if(!product) return res.status(404).send('Product not found');
        res.status(200).json(product);

    }catch(error){
        res.status(500).send('Error updating product');
    }
});

router.delete('/:id', authenticateToken, async(req,res) => {
    const productId = req.params.id;
    try{
        const product = await Product.findOneAndDelete({_id: productId, userId: req.user._id});
        if(!product) return res.status(404).send('Product not found');
        res.status(200).send('Product deleted');
    }catch(error){
        res.status(500).send('Error deleting product');
    }
});

module.exports = router;