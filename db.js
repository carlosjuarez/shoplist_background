require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    if(process.env.NODE_ENV !== 'test'){
        try{
            mongoose.connect(process.env.MONGO_URL);
            console.log('Connected to MongoDB Atlas');
        }catch(err){
            console.error('MongoDB connection error', err);
            process.exit(1);
        }
    }
};

module.exports = connectDB;