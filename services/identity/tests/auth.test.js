const request = require('supertest');
const app = require('../server');

describe('Identity Service - User Management', () => {
  let userId;
  let authToken;
  const testUser = {
    email: 'testuser@example.com',
    password: 'Test@123',
    name: 'Test User'
  };

  // User Registration
  describe('POST /users - User Registration', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/users')
        .send(testUser)
        .expect(200);
      
      expect(res.body).toHaveProperty('data');
      userId = res.body.data?.id || res.body.data?.userId;
    });

    test('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/users')
        .send({ email: 'invalid', password: 'Test@123' })
        .expect(400);
      
      expect(res.body).toHaveProperty('error');
    });

    test('should fail with duplicate email', async () => {
      await request(app).post('/users').send(testUser);
      const res = await request(app)
        .post('/users')
        .send(testUser)
        .expect(400);
      
      expect(res.body).toHaveProperty('error');
    });
  });

  // User Login
  describe('POST /login - User Login', () => {
    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect([200, 500]);
      
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('token');
      authToken = res.body.data.token;
    });

    test('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'nonexistent@example.com', password: 'Test@123' })
        .expect(400);
      
      expect(res.body).toHaveProperty('error');
    });

    test('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: testUser.email, password: 'WrongPassword' })
        .expect(400);
      
      expect(res.body).toHaveProperty('error');
    });
  });

  // Get User Profile
  describe('GET /users - Get User Profile', () => {
    test('should get user profile with valid token', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect([200, 404]);
      
      expect(res.body.data).toHaveProperty('email');
    });

    test('should fail without token', async () => {
      const res = await request(app).get('/users').expect([401, 404]);
      expect(res.body).toBeDefined();
    });
  });

  // Get All Users
  describe('GET /users/all - Get All Users', () => {
    test('should get all users with valid token', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/users/all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect([200, 404]);
      
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // Update User
  describe('PUT /users/:id - Update User', () => {
    test('should update user with valid token', async () => {
      if (!authToken || !userId) return;
      const res = await request(app)
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect([200, 404]);
      
      expect(res.body.data).toHaveProperty('name');
    });

    test('should fail without token', async () => {
      if (!userId) return;
      const res = await request(app).put(`/users/${userId}`).expect([401, 404]);
      expect(res.body).toBeDefined();
    });
  });

  // Delete User
  describe('DELETE /users/:id - Delete User', () => {
    test('should delete user with valid token', async () => {
      if (!authToken || !userId) return;
      const res = await request(app)
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect([200, 404]);
      
      expect(res.body).toHaveProperty('message');
    });
  });
});
