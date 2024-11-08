const request = require('supertest');
const app = require('../app');
const Shoplist = require('../models/shoplist');
const Product = require('../models/product');
const User = require('../models/user');

let token;
let product1;
let product2;

const userData = {
  username: 'testuser',
  password: 'testpassword'
};

beforeEach(async () => {

  await Shoplist.deleteMany({});
  await User.deleteMany({});
  await Product.deleteMany({});

  const registerResponse = await request(app)
    .post('/users/register')
    .send(userData);

  const loginResponse = await request(app)
    .post('/users/login')
    .send(userData);

  token = loginResponse.body.accessToken;

  product1 = await new Product({ name: 'Milk', date: new Date(), type: 'food', userId: registerResponse.body._id }).save();
  product2 = await new Product({ name: 'Bread', date: new Date(), type: 'bakery', userId: registerResponse.body._id }).save();
});

describe('Shoplist tests', () => {

  it('should create a new shoplist', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 },
        { productId: product2._id, quantity: 1 }
      ]
    };

    const response = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`) // Use the token for authentication
      .send(shoplistData);

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('Weekly Groceries');
    expect(new Date(response.body.date)).toEqual(shoplistData.date);
    expect(response.body.items.length).toBe(2);
    expect(response.body.items[0].productId).toBe(product1._id.toString());
    expect(response.body.items[0].quantity).toBe(2);
    expect(response.body.items[1].productId).toBe(product2._id.toString());
    expect(response.body.items[1].quantity).toBe(1);
  });

  it('should fetch all shoplists for a user', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 },
        { productId: product2._id, quantity: 1 }
      ]
    };

    await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const response = await request(app)
      .get('/shoplists')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Weekly Groceries');
    expect(response.body[0].items.length).toBe(2);
  });

  it('should retrieve a single shoplist by ID', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 },
        { productId: product2._id, quantity: 1 }
      ]
    };

    const createResponse = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const shoplistId = createResponse.body._id;

    const response = await request(app)
      .get(`/shoplists/${shoplistId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Weekly Groceries');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items[0].productId).toBe(product1._id.toString());
    expect(response.body.items[0].quantity).toBe(2);
  });

  it('should update an existing shoplist', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 }
      ]
    };

    const createResponse = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const shoplistId = createResponse.body._id;

    const updatedData = {
      name: 'Monthly Groceries',
      items: [
        { productId: product2._id, quantity: 5 }
      ]
    };

    const updateResponse = await request(app)
      .put(`/shoplists/${shoplistId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedData);

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.name).toBe('Monthly Groceries');
    expect(updateResponse.body.items.length).toBe(1);
    expect(updateResponse.body.items[0].productId).toBe(product2._id.toString());
    expect(updateResponse.body.items[0].quantity).toBe(5);
  });

  it('should delete a shoplist', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: []
    };

    const createResponse = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const shoplistId = createResponse.body._id;

    const deleteResponse = await request(app)
      .delete(`/shoplists/${shoplistId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.text).toBe('Shoplist deleted');

    const shoplist = await Shoplist.findById(shoplistId);
    expect(shoplist).toBeNull();
  });

  it('should return 404 if shoplist is not found', async () => {
    const nonExistentShoplistId = '60d21b4667d0d8992e610c85'; // Example non-existent ID

    const response = await request(app)
      .get(`/shoplists/${nonExistentShoplistId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.text).toBe('Shoplist not found');
  });

  it('should deny access to shoplist routes without a valid token', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: []
    };

    const response = await request(app)
      .post('/shoplists')
      .send(shoplistData);

    expect(response.statusCode).toBe(401);
    expect(response.text).toBe('Access denied, no token provided');
  });
  it('should mark an item in the shoplist as purchased', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 },
        { productId: product2._id, quantity: 1 }
      ]
    };

    const createResponse = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const shoplistId = createResponse.body._id;
    const itemId = createResponse.body.items[0]._id;

    const updateResponse = await request(app)
      .patch(`/shoplists/${shoplistId}/item/${itemId}/purchase`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purchased: true });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.items[0].purchased).toBe(true);
  });

  it('should unmark an item in the shoplist as not purchased', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2, purchased: true },
        { productId: product2._id, quantity: 1 }
      ]
    };

    const createResponse = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const shoplistId = createResponse.body._id;
    const itemId = createResponse.body.items[0]._id;

    const updateResponse = await request(app)
      .patch(`/shoplists/${shoplistId}/item/${itemId}/purchase`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purchased: false });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.items[0].purchased).toBe(false);
  });

  it('should archive an item in the shoplist', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 },
        { productId: product2._id, quantity: 1 }
      ]
    };

    // First, create a shoplist
    const createResponse = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const shoplistId = createResponse.body._id;
    const itemId = createResponse.body.items[0]._id;

    // Archive the first item
    const archiveResponse = await request(app)
      .patch(`/shoplists/${shoplistId}/item/${itemId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: true });

    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.body.items[0].archived).toBe(true);
  });

  it('should unarchive an item in the shoplist', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2, archived: true },
        { productId: product2._id, quantity: 1 }
      ]
    };

    // First, create a shoplist with an archived item
    const createResponse = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const shoplistId = createResponse.body._id;
    const itemId = createResponse.body.items[0]._id;

    // Unarchive the first item
    const unarchiveResponse = await request(app)
      .patch(`/shoplists/${shoplistId}/item/${itemId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: false });

    expect(unarchiveResponse.statusCode).toBe(200);
    expect(unarchiveResponse.body.items[0].archived).toBe(false);
  });

  it('should only archive the targeted item in the shoplist', async () => {
    const shoplistData = {
      name: 'Weekly Groceries',
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 },
        { productId: product2._id, quantity: 1 }
      ]
    };

    // First, create a shoplist
    const createResponse = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const shoplistId = createResponse.body._id;
    const itemIdToArchive = createResponse.body.items[0]._id;
    const unaffectedItemId = createResponse.body.items[1]._id;

    // Archive the first item
    const archiveResponse = await request(app)
      .patch(`/shoplists/${shoplistId}/item/${itemIdToArchive}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: true });

    // Check that only the targeted item is archived
    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.body.items[0].archived).toBe(true);
    expect(archiveResponse.body.items[1].archived).toBe(false);
  });

  it('should create a shoplist associated with a group', async () => {
    const groupData = { name: "Groceries Group", passcode: "abcd" };

    // Create a group
    const groupResponse = await request(app)
      .post('/groups')
      .set('Authorization', `Bearer ${token}`)
      .send(groupData);

    const groupId = groupResponse.body._id;

    const shoplistData = {
      name: "Group Shoplist",
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 },
        { productId: product2._id, quantity: 1 }
      ],
      groupId
    };

    const response = await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('Group Shoplist');
    expect(response.body.groupId).toBe(groupId);
  });

  it('should fetch shoplists by groupId', async () => {
    const groupData = { name: "Groceries Group", passcode: "abcd" };

    // Create a group
    const groupResponse = await request(app)
      .post('/groups')
      .set('Authorization', `Bearer ${token}`)
      .send(groupData);

    const groupId = groupResponse.body._id;

    const shoplistData = {
      name: "Group Shoplist",
      date: new Date(),
      items: [
        { productId: product1._id, quantity: 2 },
        { productId: product2._id, quantity: 1 }
      ],
      groupId
    };

    await request(app)
      .post('/shoplists')
      .set('Authorization', `Bearer ${token}`)
      .send(shoplistData);

    const response = await request(app)
      .get(`/shoplists?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].name).toBe('Group Shoplist');
  });

  it('should deny access to group shoplists for non-group members', async () => {
    const groupData = { name: "Private Group", passcode: "xyz" };

    // Create a private group
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


    // Attempt to access shoplists in the private group with another user's token
    const unauthorizedResponse = await request(app)
      .get(`/shoplists?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(unauthorizedResponse.statusCode).toBe(403);
    expect(unauthorizedResponse.text).toBe('Unauthorized access to group shoplists');
  });

});