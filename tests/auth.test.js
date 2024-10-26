const request = require('supertest');
const app = require('../app');
const { response } = require('express');
const User = require('../models/user');

const userData = {
    username: "testuser",
    password: 'testpassword'
}

describe('User Authentication Tests', () => {
    it('should register a new user', async() => {
        const response = await request(app)
        .post('/users/register')
        .send(userData);

        expect(response.statusCode).toBe(201);
        expect(response.body.username).toBe(userData.username);
        expect(response.body.password).not.toBeNull;
        expect(response.body._id).not.toBeNull;

        const user = await User.findOne({ username: userData.username });
        expect(user).not.toBeNull();
        expect(user.username).toBe(userData.username);
    });

    it('should log in an existing user', async() => {
        const registerResponse = await request(app)
        .post('/users/register')
        .send(userData);
        
        const response = await request(app)
        .post('/users/login')
        .send(userData);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    it('Should allow access to a protected route with a valid token',  async() => {
        const registerResponse = await request(app)
        .post('/users/register')
        .send(userData);
        
        const loginResponse = await request(app)
        .post('/users/login')
        .send(userData);
        
        const token = loginResponse.body.token;

        const protectedResponse = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

        expect(protectedResponse.statusCode).toBe(200);
        expect(protectedResponse.text).toBe(`Hello, ${userData.username}, you have access to this route`);

    });

    it('should deny access to a protected route without a token' , async () => {
        const response = await request(app).get('/protected');
        expect(response.statusCode).toBe(401);
    });

    it('should delete the user when authenticated with a valid token', async() => {
        const registerResponse = await request(app)
        .post('/users/register')
        .send(userData);
        
        const loginResponse = await request(app)
        .post('/users/login')
        .send(userData);
        
        const token = loginResponse.body.token;

        const response = await request(app)
        .delete('/users/delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: userData.password });

        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('User account deleted successfully');

        const user = await User.findOne({username: userData.username });
        expect(user).toBeNull();
    });

    it('should not delete user with incorrect password', async () => {
        const registerResponse = await request(app)
        .post('/users/register')
        .send(userData);
        
        const loginResponse = await request(app)
        .post('/users/login')
        .send(userData);
        
        const token = loginResponse.body.token;

        const response = await request(app)
        .delete('/users/delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: '1234abc' });     

        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid username or password');

        const user = await User.find({ username: userData.username});
        expect(user).not.toBeNull();
    });
});