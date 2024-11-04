const request = require('supertest');
const app = require('../app');
const Product = require('../models/product');
const User = require('../models/user');
const authenticateToken = require('../middleware/auth');

let token;

const userData = {
    username: 'testUser',
    password: 'testPassword'
};

beforeEach(async () => {

    await Product.deleteMany({});
    await User.deleteMany({});

    await request(app)
        .post('/users/register')
        .send(userData);

    const loginResult = await request(app)
        .post('/users/login')
        .send(userData);

    token = loginResult.body.accessToken;

});

describe('Product tests', () => {

    it('should add a new product', async () => {
        const productData = {
            name: "Milk",
            date: new Date(),
            type: 'food'
        };

        const response = await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .send(productData);

        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe('Milk');
        expect(response.body.type).toBe('food');
        expect(new Date(response.body.date)).toEqual(productData.date);
        expect(response.body._id).not.toBeNull();
    });

    it('should fetch all the products for a user', async () => {
        const productData = {
            name: 'Milk',
            date: new Date(),
            type: 'food'
        };

        await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .send(productData);

        const response = await request(app)
            .get('/products')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Milk');
        expect(response.body[0].type).toBe('food');
    });

    it('should update an existing product', async () => {
        const productData = {
            name: 'Milk',
            date: new Date(),
            type: 'food'
        };

        const addResponse = await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .send(productData);

        const productId = addResponse.body._id;

        const updatedData = {
            name: 'Bread',
            date: new Date(),
            type: 'Bakery'
        };

        const updateResponse = await request(app)
            .put(`/products/${productId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(updateResponse.statusCode).toBe(200);
        expect(updateResponse.body.name).toBe('Bread');
        expect(updateResponse.body.type).toBe('Bakery');
        expect(new Date(updateResponse.body.date)).toEqual(updatedData.date);
    });

    it('should delete a product', async () => {
        const productData = {
            name: 'Milk',
            date: new Date(),
            type: 'food'
        };

        const addResponse = await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .send(productData);

        const productId = addResponse.body._id;

        const deleteResponse = await request(app)
            .delete(`/products/${productId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(deleteResponse.statusCode).toBe(200);
        expect(deleteResponse.text).toBe('Product deleted');

        const product = await Product.findById(productId);
        expect(product).toBeNull();
    });

    it('should return 404 if product is not found', async () => {
        const nonExistentProductId = 'asdasfew34234sdf';

        const response = await request(app)
            .get(`/products/${nonExistentProductId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Product not found');
    });

    if ('should deny access to product routes without a valid token', async () => {
        const productData = {
            name: 'Milk',
            date: new Date(),
            type: 'food'
        };

        const response = await request(app)
            .post('/products')
            .send(productData)

        expect(response.statusCode).toBe(401);
        expect(response.body).toBe('Access denied, no token provided');
    });
    it('should add a new product associated with a group', async () => {
        const groupData = { name: "Test Group", passcode: "1234" };

        // Create a group
        const groupResponse = await request(app)
            .post('/groups')
            .set('Authorization', `Bearer ${token}`)
            .send(groupData);

        const groupId = groupResponse.body._id;

        const productData = {
            name: "Group Milk",
            date: new Date(),
            type: "food",
            groupId
        };

        const response = await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .send(productData);

        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe('Group Milk');
        expect(response.body.groupId).toBe(groupId);
    });

    it('should retrieve products by groupId', async () => {
        const groupData = { name: "Test Group", passcode: "1234" };

        // Create a group
        const groupResponse = await request(app)
            .post('/groups')
            .set('Authorization', `Bearer ${token}`)
            .send(groupData);

        const groupId = groupResponse.body._id;

        const productData = {
            name: "Group Milk",
            date: new Date(),
            type: "food",
            groupId
        };

        await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .send(productData);

        const response = await request(app)
            .get(`/products?groupId=${groupId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].name).toBe('Group Milk');
    });

    it('should deny access to group products for non-group members', async () => {
        const groupData = { name: "Restricted Group", passcode: "5678" };

        // Create a restricted group
        const groupResponse = await request(app)
            .post('/groups')
            .set('Authorization', `Bearer ${token}`)
            .send(groupData);

        const groupId = groupResponse.body._id;

        const userData2 = {
            username: 'testUser2',
            password: 'testPassword'
        };

        await request(app)
            .post('/users/register')
            .send(userData2);

        const loginResult2 = await request(app)
            .post('/users/login')
            .send(userData2);

        token2 = loginResult2.body.accessToken;

        // Attempt to access products in the restricted group with another user's token
        const unauthorizedResponse = await request(app)
            .get(`/products?groupId=${groupId}`)
            .set('Authorization', `Bearer ${token2}`);

        expect(unauthorizedResponse.statusCode).toBe(403);
        expect(unauthorizedResponse.text).toBe('Unauthorized access to group products');
    });
});

