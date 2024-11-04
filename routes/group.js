const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Group = require('../models/group');
const Product = require('../models/product');
const ShopList = require('../models/shoplist');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
    const { name, passcode } = req.body;
    const creatorId = req.user._id;

    try {
        const newGroup = new Group({ name, passcode, creatorId, members: [creatorId] });
        await newGroup.save()
        res.status(201).json(newGroup);
    } catch (error) {
        res.status(500).send('Error creating group');
    }
});

router.post('/join', authenticateToken, async (req, res) => {
    const { name, passcode } = req.body;
    const userId = req.user._id;

    try {
        const group = await Group.findOne({ name });
        if (!group) return res.status(404).send('Group not found');
        if (group.passcode !== passcode) return res.status(403).send('Invalid passcode');

        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();

            await Product.updateMany(
                { userId: userId, groupdId: { $exists: false } },
                { $set: { groupId: group._id } }
            );

            await ShopList.updateMany(
                { userId: userId, groupdId: { $exists: false } },
                { $set: { groupId: group._id } }
            );
        }
        res.status(200).json(group);
    } catch (error) {
        res.status(500).send('Error joining group');
    }
});

module.exports = router;