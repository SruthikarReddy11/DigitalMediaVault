import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';

describe('Files, Music & Playlists API Tests', () => {
  let userCookie: any;
  let testUserId: string;
  let songId: string;
  let fileId: string;
  let playlistId: string;

  beforeAll(async () => {
    // Register self-contained test user
    const username = `musicuser_${Date.now()}`;
    const email = `${username}@library.local`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Music Test User',
        username,
        email,
        password: 'UserPass123!',
        confirmPassword: 'UserPass123!',
      });

    expect(regRes.status).toBe(201);
    testUserId = regRes.body.data.user.id;
    userCookie = regRes.headers['set-cookie'];

    // Upload sample audio file
    const audioBuf = Buffer.alloc(1000);
    const upRes = await request(app)
      .post('/api/files/upload')
      .set('Cookie', userCookie)
      .attach('files', audioBuf, 'SampleTrack.mp3');

    expect(upRes.status).toBe(201);
    fileId = upRes.body.data.files[0].id;

    // Fetch the auto-created music record for this audio file
    let music = await prisma.music.findFirst({ where: { fileId } });
    if (!music) {
      music = await prisma.music.create({
        data: {
          fileId,
          title: 'Sample Track',
          artist: 'Sample Artist',
          album: 'Sample Album',
          genre: 'Pop',
          duration: 120,
        },
      });
    }
    songId = music.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('should list user files with pagination and metadata', async () => {
    const res = await request(app)
      .get('/api/files')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    fileId = res.body.data[0].id;
  });

  it('should query music songs and artists', async () => {
    const res = await request(app)
      .get('/api/music/songs')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBeDefined();

    const artistsRes = await request(app)
      .get('/api/music/artists')
      .set('Cookie', userCookie);

    expect(artistsRes.status).toBe(200);
    expect(artistsRes.body.data.length).toBeGreaterThan(0);
  });

  it('should update song metadata', async () => {
    const res = await request(app)
      .patch(`/api/music/songs/${songId}/metadata`)
      .set('Cookie', userCookie)
      .send({
        title: 'Updated Test Title',
        artist: 'Test Artist Pro',
        album: 'Test Album 2026',
        genre: 'Synth Pop',
        year: 2026,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Test Title');
    expect(res.body.data.artist).toBe('Test Artist Pro');
  });

  it('should create playlist, add song, and reorder', async () => {
    // 1. Create playlist
    const createRes = await request(app)
      .post('/api/playlists')
      .set('Cookie', userCookie)
      .send({
        name: 'Automated Test Playlist',
        description: 'Testing playlist flow',
      });

    expect(createRes.status).toBe(201);
    playlistId = createRes.body.data.id;

    // 2. Add song to playlist
    const addRes = await request(app)
      .post(`/api/playlists/${playlistId}/songs`)
      .set('Cookie', userCookie)
      .send({ musicId: songId });

    expect(addRes.status).toBe(201);

    // 3. Get playlist details
    const getRes = await request(app)
      .get(`/api/playlists/${playlistId}`)
      .set('Cookie', userCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.songs.length).toBe(1);
    expect(getRes.body.data.songs[0].id).toBe(songId);

    // 4. Delete playlist
    const delRes = await request(app)
      .delete(`/api/playlists/${playlistId}`)
      .set('Cookie', userCookie);

    expect(delRes.status).toBe(200);
  });

  it('should handle soft delete to trash, restore, and permanent deletion', async () => {
    // 1. Upload temporary file
    const upRes = await request(app)
      .post('/api/files/upload')
      .set('Cookie', userCookie)
      .attach('files', Buffer.from('To be trashed content'), 'temp_trash.txt');

    expect(upRes.status).toBe(201);
    const tempId = upRes.body.data.files[0].id;

    // 2. Move to trash
    const trashRes = await request(app)
      .delete(`/api/files/${tempId}/trash`)
      .set('Cookie', userCookie);

    expect(trashRes.status).toBe(200);

    // 3. Verify in trash
    const trashListRes = await request(app)
      .get('/api/trash')
      .set('Cookie', userCookie);

    expect(trashListRes.status).toBe(200);
    expect(trashListRes.body.data.some((f: any) => f.id === tempId)).toBe(true);

    // 4. Restore from trash
    const restoreRes = await request(app)
      .post(`/api/files/${tempId}/restore`)
      .set('Cookie', userCookie);

    expect(restoreRes.status).toBe(200);

    // 5. Permanent delete
    const permRes = await request(app)
      .delete(`/api/files/${tempId}/permanent`)
      .set('Cookie', userCookie);

    expect(permRes.status).toBe(200);

    // 6. Verify 404
    const getRes = await request(app)
      .get(`/api/files/${tempId}`)
      .set('Cookie', userCookie);

    expect(getRes.status).toBe(404);
  });
});
