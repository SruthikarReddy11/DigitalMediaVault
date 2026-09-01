import { PrismaClient, Role, FileType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Helper to generate a playable WAV audio buffer for realistic audio testing
function generateSampleWav(durationSeconds = 5, frequency = 440): Buffer {
  const sampleRate = 44100;
  const numChannels = 2;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate pleasant harmonic wave
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Harmonic chords
    const sampleVal =
      0.3 * Math.sin(2 * Math.PI * frequency * t) +
      0.2 * Math.sin(2 * Math.PI * (frequency * 1.25) * t) +
      0.1 * Math.sin(2 * Math.PI * (frequency * 1.5) * t);

    const intVal = Math.floor(sampleVal * 32767);
    const offset = 44 + i * blockAlign;
    buffer.writeInt16LE(intVal, offset); // Left
    buffer.writeInt16LE(intVal, offset + 2); // Right
  }

  return buffer;
}

// Sample SVG image buffer
function generateSampleSvg(title: string, color1 = '#3b82f6', color2 = '#8b5cf6'): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" rx="24" fill="url(#grad)"/>
    <circle cx="400" cy="250" r="80" fill="rgba(255,255,255,0.2)"/>
    <text x="400" y="380" font-family="system-ui, sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="400" y="420" font-family="system-ui, sans-serif" font-size="20" fill="rgba(255,255,255,0.8)" text-anchor="middle">Personal Digital Library Asset</text>
  </svg>`;
  return Buffer.from(svg, 'utf-8');
}

// Sample text buffer
function generateSampleDoc(title: string, content: string): Buffer {
  return Buffer.from(`# ${title}\n\n${content}\n\nGenerated on: ${new Date().toISOString()}`, 'utf-8');
}

async function main() {
  console.log('🌱 Starting database seed...');

  const storageRoot = path.resolve(__dirname, '../../storage/uploads');
  if (!fs.existsSync(storageRoot)) {
    fs.mkdirSync(storageRoot, { recursive: true });
  }

  // 1. Create Sruthikar Reddy Admin User
  const sruthikarPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const sruthikar = await prisma.user.upsert({
    where: { email: 'sruthikar@library.local' },
    update: {
      role: Role.ADMIN,
      name: 'Sruthikar Reddy',
      username: 'sruthikar',
    },
    create: {
      name: 'Sruthikar Reddy',
      username: 'sruthikar',
      email: 'sruthikar@library.local',
      passwordHash: sruthikarPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });
  console.log(`👤 Admin created: Sruthikar Reddy (Email: sruthikar@library.local, Username: sruthikar, Password: AdminPass123!)`);

  // Create System Administrator fallback
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.local' },
    update: { role: Role.ADMIN },
    create: {
      name: 'System Administrator',
      username: 'admin',
      email: 'admin@library.local',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  // 2. Create Standard User
  const userPasswordHash = await bcrypt.hash('UserPass123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@library.local' },
    update: {},
    create: {
      name: 'Alex Morgan',
      username: 'alex',
      email: 'user@library.local',
      passwordHash: userPasswordHash,
      role: Role.USER,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });
  console.log(`👤 Standard User created: user@library.local (Password: UserPass123!)`);

  // Clean existing user files in DB for fresh seed
  await prisma.file.deleteMany({ where: { userId: user.id } });
  await prisma.folder.deleteMany({ where: { userId: user.id } });
  await prisma.playlist.deleteMany({ where: { userId: user.id } });

  // 3. Create Folders
  const photosFolder = await prisma.folder.create({
    data: { name: 'Photos', userId: user.id },
  });
  const photos2025 = await prisma.folder.create({
    data: { name: '2025 Trips', userId: user.id, parentId: photosFolder.id },
  });
  const photos2026 = await prisma.folder.create({
    data: { name: '2026 Memories', userId: user.id, parentId: photosFolder.id },
  });

  const docsFolder = await prisma.folder.create({
    data: { name: 'Documents', userId: user.id },
  });
  const workDocs = await prisma.folder.create({
    data: { name: 'Work', userId: user.id, parentId: docsFolder.id },
  });

  const musicFolder = await prisma.folder.create({
    data: { name: 'Music', userId: user.id },
  });
  console.log(`📁 Folders created.`);

  // 4. Helper to write file to PostgreSQL binary storage and DB
  const saveSeedFile = async (
    originalName: string,
    buffer: Buffer,
    mimeType: string,
    fileType: FileType,
    folderId?: string | null
  ) => {
    const ext = path.extname(originalName).toLowerCase() || '.bin';
    const uuid = uuidv4();
    const storageKey = `users/${user.id}/${fileType.toLowerCase()}/${uuid}${ext}`;
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Store binary bytea in PostgreSQL
    await prisma.storageBlob.upsert({
      where: { storageKey },
      update: {
        data: buffer,
        size: BigInt(buffer.length),
        checksum,
      },
      create: {
        storageKey,
        userId: user.id,
        category: fileType.toLowerCase(),
        mimeType,
        size: BigInt(buffer.length),
        data: buffer,
        checksum,
      },
    });

    return prisma.file.create({
      data: {
        userId: user.id,
        folderId: folderId || null,
        originalName,
        storageKey,
        mimeType,
        fileType,
        extension: ext,
        size: BigInt(buffer.length),
        checksum,
      },
    });
  };

  // 5. Seed Images
  const img1 = await saveSeedFile(
    'Mountain_Sunset.svg',
    generateSampleSvg('Mountain Sunset', '#f97316', '#ec4899'),
    'image/svg+xml',
    FileType.IMAGE,
    photos2025.id
  );

  const img2 = await saveSeedFile(
    'Cyberpunk_City.svg',
    generateSampleSvg('Cyberpunk City', '#06b6d4', '#6366f1'),
    'image/svg+xml',
    FileType.IMAGE,
    photos2026.id
  );

  const img3 = await saveSeedFile(
    'Ocean_Breeze.svg',
    generateSampleSvg('Ocean Breeze', '#0ea5e9', '#10b981'),
    'image/svg+xml',
    FileType.IMAGE,
    photosFolder.id
  );

  // Favorite img1 and img2
  await prisma.favorite.create({ data: { userId: user.id, fileId: img1.id } });
  await prisma.favorite.create({ data: { userId: user.id, fileId: img2.id } });

  // 6. Seed Documents
  const doc1 = await saveSeedFile(
    'Project_Architecture_Overview.md',
    generateSampleDoc(
      'Personal Digital Library Architecture',
      'This document outlines the secure storage, media streaming, and multi-user isolation design of the system.'
    ),
    'text/markdown',
    FileType.DOCUMENT,
    workDocs.id
  );

  const doc2 = await saveSeedFile(
    'Quarterly_Goals_2026.txt',
    generateSampleDoc('Quarterly Goals 2026', '1. Master React & Node.js\n2. Build premium apps\n3. Enjoy music and media.'),
    'text/plain',
    FileType.DOCUMENT,
    docsFolder.id
  );

  // 7. Seed Music Tracks
  const sampleTracks = [
    {
      title: 'Midnight Drive',
      artist: 'Lunar Synth',
      album: 'Neon Dreams',
      genre: 'Synthwave',
      year: 2025,
      trackNumber: 1,
      duration: 185.0,
      freq: 440,
      color1: '#8b5cf6',
      color2: '#ec4899',
    },
    {
      title: 'Coffee in Kyoto',
      artist: 'Kanso Beats',
      album: 'Lo-Fi Morning',
      genre: 'Lo-Fi Chill',
      year: 2026,
      trackNumber: 1,
      duration: 142.0,
      freq: 330,
      color1: '#f59e0b',
      color2: '#d97706',
    },
    {
      title: 'Quantum Velocity',
      artist: 'Stellar Pulse',
      album: 'Astro Odyssey',
      genre: 'Electronic',
      year: 2025,
      trackNumber: 3,
      duration: 210.0,
      freq: 520,
      color1: '#06b6d4',
      color2: '#3b82f6',
    },
    {
      title: 'Rainy Cafe Walk',
      artist: 'Kanso Beats',
      album: 'Lo-Fi Morning',
      genre: 'Lo-Fi Chill',
      year: 2026,
      trackNumber: 2,
      duration: 165.0,
      freq: 370,
      color1: '#10b981',
      color2: '#059669',
    },
    {
      title: 'Starlight Echoes',
      artist: 'Lunar Synth',
      album: 'Neon Dreams',
      genre: 'Synthwave',
      year: 2025,
      trackNumber: 2,
      duration: 198.0,
      freq: 490,
      color1: '#6366f1',
      color2: '#a855f7',
    },
  ];

  const createdMusicRecords = [];

  for (const track of sampleTracks) {
    const audioBuf = generateSampleWav(6, track.freq);
    const audioFile = await saveSeedFile(
      `${track.title}.wav`,
      audioBuf,
      'audio/wav',
      FileType.AUDIO,
      musicFolder.id
    );

    // Cover art image
    const coverBuf = generateSampleSvg(`${track.album} Cover`, track.color1, track.color2);
    const coverFile = await saveSeedFile(
      `${track.title}-cover.svg`,
      coverBuf,
      'image/svg+xml',
      FileType.IMAGE,
      null
    );

    const musicRecord = await prisma.music.create({
      data: {
        fileId: audioFile.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArtist: track.artist,
        genre: track.genre,
        year: track.year,
        trackNumber: track.trackNumber,
        duration: track.duration,
        coverArtFileId: coverFile.id,
      },
    });

    createdMusicRecords.push(musicRecord);
  }

  // Favorite track 1
  await prisma.favorite.create({
    data: { userId: user.id, fileId: createdMusicRecords[0].fileId },
  });

  // 8. Create Playlists
  const chillPlaylist = await prisma.playlist.create({
    data: {
      userId: user.id,
      name: 'Focus & Chill Vibes',
      description: 'Relaxing ambient and lo-fi beats for deep programming and study sessions.',
    },
  });

  await prisma.playlistItem.create({
    data: { playlistId: chillPlaylist.id, musicId: createdMusicRecords[1].id, position: 0 },
  });
  await prisma.playlistItem.create({
    data: { playlistId: chillPlaylist.id, musicId: createdMusicRecords[3].id, position: 1 },
  });
  await prisma.playlistItem.create({
    data: { playlistId: chillPlaylist.id, musicId: createdMusicRecords[0].id, position: 2 },
  });

  const synthwavePlaylist = await prisma.playlist.create({
    data: {
      userId: user.id,
      name: 'Retro Synthwave Escapes',
      description: 'High energy 80s inspired electronic synth jams.',
    },
  });

  await prisma.playlistItem.create({
    data: { playlistId: synthwavePlaylist.id, musicId: createdMusicRecords[0].id, position: 0 },
  });
  await prisma.playlistItem.create({
    data: { playlistId: synthwavePlaylist.id, musicId: createdMusicRecords[4].id, position: 1 },
  });
  await prisma.playlistItem.create({
    data: { playlistId: synthwavePlaylist.id, musicId: createdMusicRecords[2].id, position: 2 },
  });

  // 9. Create Activity Logs
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      resourceType: 'USER',
      resourceId: user.id,
    },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'FILE_UPLOAD',
      resourceType: 'FILE',
      metadata: { count: 8 },
    },
  });

  // 10. Migrate any existing user disk files into PostgreSQL binary storage blobs
  const migrateDiskFiles = async (dir: string, baseDir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await migrateDiskFiles(fullPath, baseDir);
      } else if (entry.isFile()) {
        const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const buffer = fs.readFileSync(fullPath);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        await prisma.storageBlob.upsert({
          where: { storageKey: rel },
          update: {
            data: buffer,
            size: BigInt(buffer.length),
            checksum,
          },
          create: {
            storageKey: rel,
            size: BigInt(buffer.length),
            data: buffer,
            checksum,
          },
        });
      }
    }
  };

  await migrateDiskFiles(storageRoot, storageRoot);
  console.log('📦 All physical files migrated to PostgreSQL binary storage (storage_blobs)!');

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
