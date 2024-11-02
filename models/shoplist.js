const mongoose = require('mongoose');

const shoplistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    items: [
        {
            productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
            quantity: { type: Number, required: true},
            purchased: { type: Boolean, default: false},
            archived: { type: Boolean, default : false}
        }
    ]
});

const Shoplist = mongoose.model('Shoplist', shoplistSchema);

module.exports = Shoplist;