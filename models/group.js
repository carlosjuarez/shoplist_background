const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true},
    passcode: { type: String, required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;