const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Product = require('../models/product');

router.post('/', authenticateToken, async (req, res) => {
    const { name, date, type, groupId } = req.body;

    try {
        let newProduct;
        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group products');
            }
            newProduct = new Product({ name, date, type, userId: req.user._id, groupId });
        } else {
            newProduct = new Product({ name, date, type, userId: req.user._id });
        }
        await newProduct.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).send('Error adding product');
    }
});

router.get('/', authenticateToken, async (req, res) => {
    const { groupId } = req.query;

    try {
        let products;
        if (groupId) {

            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unaauthorized access to group products');
            }
            products = await Product.find({ groupId });
        } else {
            products = await Product.find({ userId: req.user._id });
        }

        res.status(200).json(products);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching products');
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    const { productId, groupId } = req.params.id;
    try {
        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group products');
            }
        }

        const products = await Product.findOne({
            _id: productId,
            $or: [
                { userId: req.user._id },
                { groupId: groupId }
            ]
        });
        res.status(200).json(products);
    } catch (error) {
        res.status(404).send('Product not found');
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { name, date, type, groupId } = req.body;
    const productId = req.params.id;
    try {

        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group products');
            }
        }

        const product = await Product.findOneAndUpdate(
            {
                _id: productId,
                $or: [
                    { userId: req.user._id },
                    { groupId: groupId }
                ]

            },
            { name, date, type, groupId },
            { new: true }
        );
        if (!product) return res.status(404).send('Product not found');
        res.status(200).json(product);

    } catch (error) {
        res.status(500).send('Error updating product');
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const productId = req.params.id;
    const groupId = req.query.groupId;
    try {

        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group products');
            }
        }

        const product = await Product.findOneAndDelete({
            _id: productId,
            $or: [
                { userId: req.user._id },
                { groupId: groupId }
            ]
        });
        if (!product) return res.status(404).send('Product not found');
        res.status(200).send('Product deleted');
    } catch (error) {
        res.status(500).send('Error deleting product');
    }
});

module.exports = router;