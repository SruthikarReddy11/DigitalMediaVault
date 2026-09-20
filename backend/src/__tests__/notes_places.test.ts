import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';

describe('Secure Notes & Places/Plans Integration Tests', () => {
  let userCookie: any;
  let userPassword = 'StrongPassword123!';
  let userId: string;
  let normalNoteId: string;
  let protectedNoteId: string;
  let hiddenNoteId: string;
  let testPlaceId: string;
  let testTripId: string;

  beforeAll(async () => {
    // Register a fresh test user
    const username = `np_user_${Date.now()}`;
    const email = `${username}@test.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Notes & Places User',
        username,
        email,
        password: userPassword,
        confirmPassword: userPassword,
      });

    expect(res.status).toBe(201);
    userCookie = res.headers['set-cookie'];
    userId = res.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up created resources
    await prisma.tripPlanPlace.deleteMany({ where: { tripPlan: { userId } } });
    await prisma.tripPlanNote.deleteMany({ where: { tripPlan: { userId } } });
    await prisma.tripPlan.deleteMany({ where: { userId } });
    await prisma.placeReminder.deleteMany({ where: { place: { userId } } });
    await prisma.place.deleteMany({ where: { userId } });
    await prisma.note.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('Feature 1: Secure Notes', () => {
    it('should create a standard note with tags and content', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Cookie', userCookie)
        .send({
          title: 'My Project Ideas',
          content: 'Here are some cool thoughts for the project.',
          tags: ['ideas', 'work'],
          color: '#3b82f6',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('My Project Ideas');
      expect(res.body.data.content).toBe('Here are some cool thoughts for the project.');
      expect(res.body.data.tags).toEqual(['ideas', 'work']);
      expect(res.body.data.isPasswordProtected).toBe(false);
      normalNoteId = res.body.data.id;
    });

    it('should create a password-protected note with AES-256-GCM encryption', async () => {
      const notePassword = 'SecretNotePass123!';
      const sensitiveContent = 'Confidential bank account numbers and recovery keys';

      const res = await request(app)
        .post('/api/notes')
        .set('Cookie', userCookie)
        .send({
          title: 'Financial Vault Notes',
          content: sensitiveContent,
          tags: ['finance', 'secret'],
          isPasswordProtected: true,
          password: notePassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Financial Vault Notes');
      expect(res.body.data.isPasswordProtected).toBe(true);
      protectedNoteId = res.body.data.id;

      // Verify at database level: content column is null and encrypted bytes are populated
      const dbNote = await prisma.note.findUnique({ where: { id: protectedNoteId } });
      expect(dbNote?.content).toBeNull();
      expect(dbNote?.encryptedContent).not.toBeNull();
      expect(dbNote?.encryptionIv).not.toBeNull();
      expect(dbNote?.encryptionTag).not.toBeNull();
      expect(dbNote?.encryptionSalt).not.toBeNull();
      expect(dbNote?.passwordHash).not.toBeNull();
    });

    it('should fail to unlock password-protected note with wrong password', async () => {
      const res = await request(app)
        .post(`/api/notes/${protectedNoteId}/unlock`)
        .set('Cookie', userCookie)
        .send({ password: 'IncorrectPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully unlock and decrypt password-protected note with correct password', async () => {
      const res = await request(app)
        .post(`/api/notes/${protectedNoteId}/unlock`)
        .set('Cookie', userCookie)
        .send({ password: 'SecretNotePass123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Confidential bank account numbers and recovery keys');
    });

    it('should create a hidden note and exclude it from the standard notes list', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Cookie', userCookie)
        .send({
          title: 'Top Secret Hidden Note',
          content: 'This note must not show up in the normal notes list.',
          isHidden: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isHidden).toBe(true);
      hiddenNoteId = res.body.data.id;

      // Query standard notes list: must NOT contain the hidden note
      const listRes = await request(app)
        .get('/api/notes')
        .set('Cookie', userCookie);

      expect(listRes.status).toBe(200);
      const ids = listRes.body.data.map((n: any) => n.id);
      expect(ids).not.toContain(hiddenNoteId);
      expect(ids).toContain(normalNoteId);
    });

    it('should require authentication token to access Hidden Notes Vault', async () => {
      const res = await request(app)
        .get('/api/notes/hidden')
        .set('Cookie', userCookie);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('HIDDEN_NOTES_LOCKED');
    });

    it('should unlock Hidden Notes Vault using user account password and view hidden notes', async () => {
      // 1. Authenticate with account password
      const unlockRes = await request(app)
        .post('/api/notes/hidden/unlock')
        .set('Cookie', userCookie)
        .send({ password: userPassword });

      expect(unlockRes.status).toBe(200);
      expect(unlockRes.body.success).toBe(true);
      const hiddenToken = unlockRes.body.data.token;
      expect(hiddenToken).toBeDefined();

      // 2. Fetch hidden notes using token header
      const hiddenListRes = await request(app)
        .get('/api/notes/hidden')
        .set('Cookie', userCookie)
        .set('x-notes-hidden-token', hiddenToken);

      expect(hiddenListRes.status).toBe(200);
      expect(hiddenListRes.body.success).toBe(true);
      const hiddenIds = hiddenListRes.body.data.map((n: any) => n.id);
      expect(hiddenIds).toContain(hiddenNoteId);
    });

    it('should pin and archive notes properly', async () => {
      // Pin
      const pinRes = await request(app)
        .patch(`/api/notes/${normalNoteId}/pin`)
        .set('Cookie', userCookie);
      expect(pinRes.status).toBe(200);
      expect(pinRes.body.data.isPinned).toBe(true);

      // Archive
      const archiveRes = await request(app)
        .patch(`/api/notes/${normalNoteId}/archive`)
        .set('Cookie', userCookie);
      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.isArchived).toBe(true);
    });
  });

  describe('Feature 2: Places & Plans', () => {
    it('should resolve a Google Maps URL or fallback gracefully', async () => {
      const mapsUrl = 'https://maps.google.com/?q=Taj+Mahal+Agra';
      const res = await request(app)
        .post('/api/places/resolve')
        .set('Cookie', userCookie)
        .send({ url: mapsUrl });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBeDefined();
    });

    it('should save a place with reminder and status', async () => {
      const reminderDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/places')
        .set('Cookie', userCookie)
        .send({
          name: 'Taj Mahal',
          address: 'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001',
          category: 'Historical Landmark',
          rating: 4.8,
          userRatingsTotal: 250000,
          googleMapsUrl: 'https://maps.google.com/?q=Taj+Mahal',
          status: 'WANT_TO_VISIT',
          reminderDate,
          notes: 'Visit at sunrise for best photos',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Taj Mahal');
      expect(res.body.data.status).toBe('WANT_TO_VISIT');
      expect(res.body.data.reminders.length).toBeGreaterThanOrEqual(1);
      testPlaceId = res.body.data.id;
    });

    it('should update place status and mark as visited', async () => {
      const res = await request(app)
        .patch(`/api/places/${testPlaceId}/status`)
        .set('Cookie', userCookie)
        .send({ status: 'VISITED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('VISITED');
      expect(res.body.data.visitedAt).not.toBeNull();
    });

    it('should create a multi-module Trip Plan and link saved places and notes', async () => {
      // 1. Create Trip Plan
      const tripRes = await request(app)
        .post('/api/trip-plans')
        .set('Cookie', userCookie)
        .send({
          name: 'North India Golden Triangle Tour',
          description: 'Exploring Delhi, Agra and Jaipur',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          budget: 50000,
          coverColor: '#0ea5e9',
        });

      expect(tripRes.status).toBe(201);
      testTripId = tripRes.body.data.id;

      // 2. Link Place & Note to Trip Plan via update
      const updateRes = await request(app)
        .put(`/api/trip-plans/${testTripId}`)
        .set('Cookie', userCookie)
        .send({
          placeIds: [testPlaceId],
          noteIds: [normalNoteId],
        });

      expect(updateRes.status).toBe(200);

      // 3. Retrieve complete Trip Plan details
      const detailRes = await request(app)
        .get(`/api/trip-plans/${testTripId}`)
        .set('Cookie', userCookie);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.name).toBe('North India Golden Triangle Tour');
      expect(detailRes.body.data.places.length).toBe(1);
      expect(detailRes.body.data.places[0].place.name).toBe('Taj Mahal');
      expect(detailRes.body.data.notes.length).toBe(1);
      expect(detailRes.body.data.notes[0].note.title).toBe('My Project Ideas');
    });

    it('should add a place to a trip plan via POST /api/trip-plans/:id/places', async () => {
      // Create a second place
      const placeRes = await request(app)
        .post('/api/places')
        .set('Cookie', userCookie)
        .send({
          name: 'Agra Fort',
          address: 'Agra, Uttar Pradesh',
          googleMapsUrl: 'https://maps.google.com/?q=Agra+Fort',
          status: 'PLANNED',
        });
      expect(placeRes.status).toBe(201);
      const secondPlaceId = placeRes.body.data.id;

      // Add to trip
      const addRes = await request(app)
        .post(`/api/trip-plans/${testTripId}/places`)
        .set('Cookie', userCookie)
        .send({ placeId: secondPlaceId });

      expect(addRes.status).toBe(200);
      expect(addRes.body.data.places.length).toBe(2);
      expect(addRes.body.data.places.some((p: any) => p.placeId === secondPlaceId)).toBe(true);

      // Remove from trip
      const removeRes = await request(app)
        .delete(`/api/trip-plans/${testTripId}/places/${secondPlaceId}`)
        .set('Cookie', userCookie);

      expect(removeRes.status).toBe(200);
      expect(removeRes.body.data.places.some((p: any) => p.placeId === secondPlaceId)).toBe(false);
    });

    it('should update place trip plan association via PUT /api/places/:id', async () => {
      // Update place to link to testTripId
      const updatePlaceRes = await request(app)
        .put(`/api/places/${testPlaceId}`)
        .set('Cookie', userCookie)
        .send({
          tripPlanId: testTripId,
        });

      expect(updatePlaceRes.status).toBe(200);
      expect(updatePlaceRes.body.data.tripPlans.length).toBeGreaterThanOrEqual(1);
      expect(updatePlaceRes.body.data.tripPlans[0].tripPlan.id).toBe(testTripId);

      // Unlink place from trip plan
      const unlinkRes = await request(app)
        .put(`/api/places/${testPlaceId}`)
        .set('Cookie', userCookie)
        .send({
          tripPlanId: null,
        });

      expect(unlinkRes.status).toBe(200);
      expect(unlinkRes.body.data.tripPlans.length).toBe(0);
    });
  });
});
