process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll( async() =>{
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

beforeEach(async() =>{
    const collections = await mongoose.connection.db.collections();
    for( let collection of collections){
        await collection.deleteMany();
    }
});

afterAll(async() => {
    await mongoose.disconnect();
    await mongoServer.stop();
});