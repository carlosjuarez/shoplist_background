const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Product = require('../models/product');
const Shoplist = require('../models/shoplist');

router.post('/', authenticateToken, async (req,res) => {
    const {name, date, items } = req.body;

    try{
        const shoplist = new Shoplist({name, date, items, userId: req.user._id});
        shoplist.save();
        res.status(201).json(shoplist);
    } catch (error){
        console.log(error);
        res.status(500).send('Error creating shoplist');
    }
});

router.get('/', authenticateToken, async (req,res) => {
    try{
        const shoplists = await Shoplist.find({userId: req.user._id});
        res.status(200).json(shoplists);
    }catch(error){
        res.status(500).send('Error fetching shoplists');
    }
});

router.get('/:id', authenticateToken, async (req,res) =>{
    const shoplistId = req.params.id;
    try{
        const shoplist = await Shoplist.findOne({_id: shoplistId, userId: req.user._id});
        if(!shoplist) return res.status(404).send('Shoplist not found');
        res.status(200).json(shoplist);
    }catch(error){
        res.status(500).send('Error fetching shoplist');
    }
});

router.put('/:id', authenticateToken, async (req,res) => {
    const {name, items } = req.body;
    const shoplistId = req.params.id;
    try{
        const shoplist = await Shoplist.findOneAndUpdate(
            { _id: shoplistId, userId: req.user._id},
            {name, items},
            {new: true}
        );
        if(!shoplist) return res.status(404).send('Shoplist not found');
        res.status(200).json(shoplist);
    }catch(error){
        res.status(500).send('Error updating shoplist');
    }
});

router.delete('/:id', authenticateToken, async (req,res) =>{
    const shoplistId = req.params.id;
    try{
        const shoplist = await Shoplist.findOneAndDelete({_id: shoplistId, userId: req.user._id});
        if(!shoplist) return res.status(404).send('Shoplist not found');
        res.status(200).send('Shoplist deleted');
    }catch(error){
        res.status(500).send("Error deleting shoplist");
    }
});

router.patch('/:shoplistId/item/:itemId/purchase', authenticateToken, async (req,res) => {
    const {shoplistId, itemId } = req.params;
    const {purchased} = req.body;

    try{
        const list = await Shoplist.find();
        const shoplist = await Shoplist.findOneAndUpdate(
          {_id: shoplistId, "items._id": itemId, userId: req.user._id},
          {$set: { 'items.$.purchased': purchased }},
          {new: true}  
        );
        if(!shoplist) return res.status(404).send('Shoplist or item not found');
        res.status(200).json(shoplist);
    }catch(error){
        console.log(error)
        res.status(500).send('Error updating item status');
    }
});

module.exports = router;