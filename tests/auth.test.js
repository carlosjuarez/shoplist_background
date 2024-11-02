const request = require('supertest');
const app = require('../app');
const { response } = require('express');
const User = require('../models/user');

const userData = {
    username: "testuser",
    password: 'testpassword'
}

beforeEach(async () => {
    await User.deleteMany({});
    await request(app)
    .post('/users/register')
    .send(userData);
});

describe('User Authentication Tests', () => {

    /* it('should register a new user', async() => {
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
 */
    it('should log in an return access and refresh token', async() => {
        const response = await request(app)
        .post('/users/login')
        .send(userData);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        accessToken = response.body.accessToken;
        refreshToken = response.body.refreshToken;

        const user = await User.findOne({ username: userData.username});
        expect(user.refreshToken).toBe(refreshToken);
    });

    it('should refresh the access token using a valid refresh token', async () => {
        const loginResponse = await request(app)
        .post('/users/login')
        .send(userData);

        refreshToken = loginResponse.body.refreshToken;

        const refreshResponse = await request(app)
        .post('/users/refresh')
        .send({refreshToken});

        expect(refreshResponse.statusCode).toBe(200);
        expect(refreshResponse.body).toHaveProperty('accessToken');
    });

    it('should return 403 for an invalid refresh token', async () => {
        const invalidToken = 'invalidToken';
        const response = await request(app)
        .post('/users/refresh')
        .send({refreshToken: invalidToken});

        expect(response.statusCode).toBe(403);
        expect(response.text).toBe('Invalid refresh token');
    });

    if('should logout and invalidate the refresh token', async() => {
        const loginResponse = await request(app)
        .post('/users/login')
        .send(userData);

        refreshToken = loginResponse.body.refreshToken;

        const logoutResponse = await request(app)
        .post('/users/logout')
        .send({refreshToken});

        expect(logoutResponse.statusCode).toBe(200);
        expect(logoutResponse.text).toBe('Logged out');

        const user = await User.findOne({username: userData.username});
        expect(user.refreshToken).toBeNull();

    });

    it('Should allow access to a protected route with a valid token',  async() => {
        const loginResponse = await request(app)
        .post('/users/login')
        .send(userData);
        
        const token = loginResponse.body.accessToken;

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
        const loginResponse = await request(app)
        .post('/users/login')
        .send(userData);
        
        const token = loginResponse.body.accessToken;

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
        const loginResponse = await request(app)
        .post('/users/login')
        .send(userData);
        
        const token = loginResponse.body.accessToken;

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