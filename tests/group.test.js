const request = require('supertest');
const app = require('../app');
const Group = require('../models/group');
const User = require('../models/user');

let token;
let userId;

beforeEach(async () => {
    // Clear groups and users before each test
    await Group.deleteMany({});
    await User.deleteMany({});

    // Create a test user and log them in to get a token
    const userResponse = await request(app)
        .post('/users/register')
        .send({ username: 'testuser', password: 'password' });

    userId = userResponse.body._id;

    const loginResponse = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'password' });

    token = loginResponse.body.accessToken;
});

describe('Group tests', () => {

    it('should create a new group successfully', async () => {
        const response = await request(app)
            .post('/groups')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test Group', passcode: '1234' });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('name', 'Test Group');
        expect(response.body).toHaveProperty('passcode', '1234');
        expect(response.body.members).toContain(userId);
    });

    it('should fail to create a group with missing fields', async () => {
        const response = await request(app)
            .post('/groups')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Incomplete Group' }); // Missing passcode

        expect(response.statusCode).toBe(500);
        expect(response.text).toBe('Error creating group');
    });

    it('should join an existing group with the correct passcode', async () => {
        // First, create a group
        const group = new Group({
            name: 'Existing Group',
            passcode: '5678',
            creatorId: userId,
            members: [userId]
        });
        await group.save();

        // Create a second user
        const secondUserResponse = await request(app)
            .post('/users/register')
            .send({ username: 'seconduser', password: 'password' });

        const secondUserId = secondUserResponse.body._id;

        const loginResponse = await request(app)
            .post('/users/login')
            .send({ username: 'seconduser', password: 'password' });

        const secondUserToken = loginResponse.body.accessToken;

        // Join the group with the second user
        const joinResponse = await request(app)
            .post('/groups/join')
            .set('Authorization', `Bearer ${secondUserToken}`)
            .send({ name: 'Existing Group', passcode: '5678' });

        expect(joinResponse.statusCode).toBe(200);
        expect(joinResponse.body.members).toContain(secondUserId);
    });

    it('should fail to join a group with an incorrect passcode', async () => {
        // First, create a group
        const group = new Group({
            name: 'Protected Group',
            passcode: 'abcd',
            creatorId: userId,
            members: [userId]
        });
        await group.save();

        // Try to join with an incorrect passcode
        const joinResponse = await request(app)
            .post('/groups/join')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Protected Group', passcode: 'wrongpass' });

        expect(joinResponse.statusCode).toBe(403);
        expect(joinResponse.text).toBe('Invalid passcode');
    });

    it('should return 404 when trying to join a non-existent group', async () => {
        const joinResponse = await request(app)
            .post('/groups/join')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'NonExistent Group', passcode: '1234' });

        expect(joinResponse.statusCode).toBe(404);
        expect(joinResponse.text).toBe('Group not found');
    });
});
