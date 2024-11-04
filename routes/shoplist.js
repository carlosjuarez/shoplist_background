const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Product = require('../models/product');
const Group = require('../models/group');
const Shoplist = require('../models/shoplist');

router.post('/', authenticateToken, async (req, res) => {
    const { name, date, items, groupId } = req.body;

    try {
        const shoplist = new Shoplist({ name, date, items, groupId: groupId, userId: req.user._id });
        shoplist.save();
        res.status(201).json(shoplist);
    } catch (error) {
        res.status(500).send('Error creating shoplist');
    }
});

router.get('/', authenticateToken, async (req, res) => {
    const { groupId } = req.query;

    try {

        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group shoplists');
            }
        }
        const shoplists = await Shoplist.find({
            $or: [
                { userId: req.user._id },
                { groupId: groupId }
            ]
        });

        res.status(200).json(shoplists);
    } catch (error) {
        res.status(500).send('Error fetching shoplists');
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    const shoplistId = req.params.id;
    const { groupId } = req.body;
    try {
        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group shoplists');
            }
        }

        const shoplist = await Shoplist.findOne({ _id: shoplistId, $or: [{ userId: req.user._id }, { groupId: groupId }] });
        if (!shoplist) return res.status(404).send('Shoplist not found');
        res.status(200).json(shoplist);
    } catch (error) {
        res.status(500).send('Error fetching shoplist');
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { name, items, groupId } = req.body;
    const shoplistId = req.params.id;
    try {

        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group shoplists');
            }
        }
        const shoplist = await Shoplist.findOneAndUpdate(
            { _id: shoplistId, $or: [{ userId: req.user._id }, { groupId: groupId }] },
            { name, items },
            { new: true }
        );
        if (!shoplist) return res.status(404).send('Shoplist not found');
        res.status(200).json(shoplist);
    } catch (error) {
        res.status(500).send('Error updating shoplist');
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const shoplistId = req.params.id;
    const { groupId } = req.query;
    try {
        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group shoplists');
            }
        }

        const shoplist = await Shoplist.findOneAndDelete({ _id: shoplistId, $or: [{ userId: req.user._id }, { groupId: groupId }] });
        if (!shoplist) return res.status(404).send('Shoplist not found');
        res.status(200).send('Shoplist deleted');
    } catch (error) {
        res.status(500).send("Error deleting shoplist");
    }
});

router.patch('/:shoplistId/item/:itemId/purchase', authenticateToken, async (req, res) => {
    const { shoplistId, itemId } = req.params;
    const { purchased, groupId } = req.body;

    try {
        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group shoplists');
            }
        }

        const shoplist = await Shoplist.findOneAndUpdate(
            { _id: shoplistId, $or: [{ userId: req.user._id }, { groupId: groupId }], "items._id": itemId },
            { $set: { 'items.$.purchased': purchased } },
            { new: true }
        );
        if (!shoplist) return res.status(404).send('Shoplist or item not found');
        res.status(200).json(shoplist);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error updating item status');
    }
});


router.patch('/:shoplistId/item/:itemId/archive', authenticateToken, async (req, res) => {
    const { shoplistId, itemId } = req.params;
    const { archived, groupId } = req.body;
    try {

        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group || !group.members.includes(req.user._id)) {
                return res.status(403).send('Unauthorized access to group shoplists');
            }
        }

        const shoplist = await Shoplist.findOneAndUpdate(
            { _id: shoplistId, $or: [{ userId: req.user._id }, { groupId: groupId }], "items._id": itemId },
            { $set: { 'items.$.archived': archived } },
            { new: true }
        );
        if (!shoplist) return res.status(404).text('Shoplist item not found');
        res.status(200).json(shoplist);
    } catch (error) {
        res.status(500).send('Error archiving item')
    }
});


module.exports = router;