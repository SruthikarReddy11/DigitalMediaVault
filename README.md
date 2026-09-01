# Personal Digital Library & Media Vault 📚🎵🖼️

A production-grade, multi-user **Personal Digital Library & Media Gallery** built with **React 18**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**.

---

## 🌟 Key Features

### 1. Dedicated Modern Music Player & Library
- **Persistent Global Audio Player**: Uninterrupted audio playback that persists seamlessly across page navigation and client routes.
- **Rich ID3 Tag Extraction**: Automatic extraction of Title, Artist, Album, Genre, Year, Duration, Bitrate, and embedded Album Cover Art upon upload using `music-metadata`.
- **Lossless Seek & Streaming**: Partial content streaming (`HTTP 206`) with byte-range requests for instant seeking.
- **Queue Management**: Add songs to play next, view active queue, jump to tracks, and reorder.
- **Playlists System**: Create, edit, reorder tracks (Move up/down), and play entire playlists with 1-click shuffle.
- **ID3 Metadata Editor**: In-browser tag editor to update title, artist, album, genre, year, and track number.

### 2. Multi-Format Media Vault & Viewers
- **Image Gallery**: Masonry grid with responsive thumbnails, search, folder filter, and favorite filter.
- **Image Lightbox**: Fullscreen zoom in/out/pan, EXIF & file metadata inspection drawer, and keyboard navigation (Left/Right arrows, Escape).
- **Video Player**: Custom HTML5 video player with speed controls (0.75x to 2x), interactive seek bar, volume control, and fullscreen.
- **Universal Document Previews**: Embedded viewer for PDFs, syntax/text display for Markdown/JSON/TXT/logs, and direct download for archives (`.zip`, `.tar`, `.7z`) and office files.

### 3. File System & Folder Hierarchy
- **Nested Folders**: Create, rename, delete folders, and organize files into parent/child directory trees.
- **Interactive Breadcrumbs**: Fast traversal through folder depths.
- **File Operations**: Rename, Move between folders, Bookmark/Favorite, Soft Delete to Trash, and Permanent Purge.
- **Drag-and-Drop Multi-File Uploader**: Real-time progress bar with automatic file classification.

### 4. Enterprise-Grade Security & Multi-User Isolation
- **Role-Based Access Control (RBAC)**: `USER` and `ADMIN` roles.
- **Strict Ownership Checks**: Every resource access verifies user ownership. Cross-user access returns `403 Forbidden`.
- **Session Authentication**: Cryptographically secure 32-byte session tokens stored in secure, `HTTP-only`, `SameSite=Lax` cookies with SHA-256 token hashing in PostgreSQL.
- **Path Traversal Protection**: Storage service canonicalizes and prevents relative directory traversal attacks (`../`).

### 5. Administrator Management Console
- **Admin Dashboard**: System metrics (Total Users, Files, Storage Volume breakdown by file type, real-time activity stream).
- **User Management**: Inspect registered users, activate/deactivate accounts, promote to Admin, and inspect storage consumption.
- **Global File Explorer**: Search and inspect all uploaded files across all users.
- **Audit & Security Logs**: Comprehensive log trail of logins, uploads, deletions, and administrative actions with IP addresses and timestamps.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Backend** | Node.js, Express.js (v5), TypeScript, Prisma ORM, Multer, `music-metadata` |
| **Database** | PostgreSQL 18 with relational schema and indexes |
| **Storage Engine** | Pluggable Storage Abstraction (`IStorageService` - Local Filesystem & S3 compatible) |
| **Testing** | Jest, Supertest, TypeScript ts-jest (18 automated integration tests) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **PostgreSQL**: v14+ (or local PostgreSQL cluster)

### 2. Database & Backend Configuration
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres@127.0.0.1:5433/personal_library?schema=public"
SESSION_SECRET="your-ultra-secure-random-secret-key-32-chars-min"
SESSION_EXPIRES_DAYS=7
STORAGE_PROVIDER="local"
STORAGE_LOCAL_PATH="./uploads"
MAX_FILE_SIZE_MB=500
CORS_ORIGIN="http://localhost:5173"
```

### 3. Database Migration & Seed
Run from the root directory:
```bash
# Push Prisma schema to PostgreSQL
npm --prefix backend run prisma:push

# Seed with Demo accounts, folders, SVG images, markdown documents, and tagged audio tracks
npm run seed:backend
```

### 4. Run Development Servers
In two terminal tabs:

**Terminal 1 (Backend API on port 5000):**
```bash
npm run dev:backend
```

**Terminal 2 (Frontend UI on port 5173):**
```bash
npm run dev:frontend
```

Open your browser at `http://localhost:5173`.

---

## 🔑 Demo Accounts

The database seeder provisions two ready-to-use accounts with sample data:

| Account Type | Email | Password |
|---|---|---|
| **Admin Console** | `admin@library.local` | `AdminPass123!` |
| **Standard User** | `user@library.local` | `UserPass123!` |

*(Both login forms include **1-Click Quick Demo Login** buttons for instantaneous login)*.

---

## 🧪 Automated Test Suite

Run the full integration test suite covering Authentication, Resource Ownership & Security (`403 Forbidden` verification), Admin Role Bypass, File Management, ID3 Metadata, and Playlists:

```bash
npm run test:backend
```

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Relational database schema
│   │   └── seed.ts               # Database seed script with sample files & audio
│   ├── src/
│   │   ├── controllers/          # Express route controllers
│   │   ├── middleware/           # Auth, ownership, rate limiter, error handler
│   │   ├── routes/               # REST API endpoints
│   │   ├── services/             # Domain business logic & activity logging
│   │   ├── storage/              # Pluggable IStorageService & LocalStorageService
│   │   ├── utils/                # Audio ID3 metadata extractor, MIME helpers, security
│   │   ├── validators/           # Zod validation schemas
│   │   └── __tests__/            # Jest integration test suites
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Modal, ConfirmDialog, Skeleton, EmptyState, Badge
│   │   │   ├── files/            # FilePreviewModal, MoveFileModal
│   │   │   ├── gallery/          # ImageLightbox with zoom, pan, EXIF
│   │   │   ├── layout/           # Sidebar, Header with search, AppLayout
│   │   │   ├── music/            # MetadataEditModal, AddToPlaylistModal
│   │   │   ├── player/           # PersistentPlayer global bottom bar
│   │   │   ├── upload/           # UploadModal drag-and-drop
│   │   │   └── video/            # VideoPlayerModal custom player
│   │   ├── contexts/             # AuthContext, AudioPlayerContext, ThemeContext, ToastContext
│   │   ├── pages/                # Dashboard, Gallery, Videos, Music, Files, Favorites, Trash, Settings
│   │   │   └── admin/            # AdminDashboard, AdminUsers, AdminFiles, AdminLogs
│   │   ├── routes/               # AppRoutes with Protected & Admin guards
│   │   ├── services/             # Axios API client modules
│   │   └── types/                # Frontend TypeScript definitions
│   └── package.json
└── package.json                  # Root workspace scripts
```

---

## 🔒 Security Architecture Highlights
1. **Password Hashing**: Salted `bcryptjs` password hashing with cost factor 10.
2. **Session Security**: Session tokens are hashed via SHA-256 in the database. Cookies are flagged `HttpOnly`, `SameSite=Lax`, and `Path=/`.
3. **HTTP 206 Byte-Range Streaming**: Enables real-time scrubbing and partial loading without reading whole large media files into memory.
4. **Strict Path Isolation**: File storage uses cryptographically unique UUIDs on disk, preventing user-controlled filenames from escaping storage roots.
