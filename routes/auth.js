const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Import User model
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/auth');

router.post('/register', async (req, res) => {
    const {username,password} = req.body;

    try{        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({username, password: hashedPassword});
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        if(error.code === 11000){
            res.status(400).send("Username already exists");
        } else {
            res.status(500).send('Error registering user');
        }
    }
});

router.post('/login', async (req,res) => {
    const {username,password} = req.body;

    try{
        const user = await User.findOne({username});
        if(!user){
            return res.status(401).send('Invalid username or password');
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(402).send('Invalid Username or password');
        }

        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h'});
        res.status(200).json({token});

    } catch (error){
        res.status(500).send('Error logging in');
    }
});

router.delete('/delete', authenticateToken, async (req,res) => {
    const { password } = req.body

    try{
        const isPasswordValid = await bcrypt.compare(password, req.user.password);
        if(!isPasswordValid){
            return res.status(401).send('Invalid username or password');
        }

        await User.deleteOne({username: req.user.username });

        res.status(200).send('User account deleted successfully');

    } catch (error){
        res.status(500).send('Error deleting user account');
    }
});

module.exports = router;