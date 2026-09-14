import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { FileService } from './file.service';
import { MusicService } from './music.service';
import { CalendarService } from './calendar.service';
import { FavoriteService } from './favorite.service';
import { CricketService, CricketMatch } from './cricket.service';
import { CalendarEventType, FileType } from '@prisma/client';
import https from 'https';
import http from 'http';

export interface AiActionResult {
  action:
    | 'GENERAL_CHAT'
    | 'PLAY_MUSIC'
    | 'CRICKET'
    | 'CALENDAR_EVENT_ADDED'
    | 'CALENDAR_EVENTS_LIST'
    | 'FILES_RETRIEVED'
    | 'PRODUCTS_RETRIEVED'
    | 'FAVORITE_UPDATED'
    | 'FAVORITES_LIST'
    | 'IMAGE_GENERATED'
    | 'AUTH_REQUIRED';
  reply: string;
  data?: any;
}

export class AiService {
  /**
   * Helper to download image buffer from a remote URL
   */
  public static async downloadImageBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client
        .get(url, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return this.downloadImageBuffer(res.headers.location).then(resolve).catch(reject);
          }
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Failed to download image: HTTP status ${res.statusCode}`));
          }
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        })
        .on('error', reject);
    });
  }

  /**
   * Generate an image from a text prompt using high-fidelity Flux/SDXL neural generator
   */
  public static async generateImage(prompt: string): Promise<{ imageUrl: string; prompt: string }> {
    const cleanPrompt = prompt.trim();
    const seed = Math.floor(Math.random() * 10000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      cleanPrompt
    )}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

    return {
      imageUrl,
      prompt: cleanPrompt,
    };
  }

  /**
   * Save an AI-generated image into the user's personal media gallery
   */
  public static async saveGeneratedImage(user: AuthUser, imageUrl: string, promptText?: string) {
    const buffer = await this.downloadImageBuffer(imageUrl);
    const originalName = `ai-gen-${Date.now()}.png`;

    const file = await FileService.uploadFile(user, {
      buffer,
      originalname: originalName,
      mimetype: 'image/png',
      size: buffer.length,
    });

    if (file && file.id) {
      await prisma.file.update({
        where: { id: file.id },
        data: {
          tags: ['ai-generated', ...(promptText ? [promptText.slice(0, 40)] : [])],
        },
      });
    }

    return file;
  }

  /**
   * Process a natural language prompt and execute authorized database actions
   */
  public static async processPrompt(
    prompt: string,
    user?: AuthUser | null
  ): Promise<AiActionResult> {
    const text = prompt.trim();
    const lower = text.toLowerCase();

    // 1. IMAGE GENERATION INTENT
    if (
      lower.startsWith('generate image') ||
      lower.startsWith('create image') ||
      lower.startsWith('draw') ||
      lower.startsWith('generate an image') ||
      lower.startsWith('create an image') ||
      lower.includes('generate a picture') ||
      lower.includes('generate image of')
    ) {
      const cleanPrompt = text
        .replace(/^(generate an image of|generate image of|create an image of|generate image|create image|draw an image of|draw a picture of|draw|make an image of)\s*/i, '')
        .trim();

      const imageResult = await this.generateImage(cleanPrompt || text);
      return {
        action: 'IMAGE_GENERATED',
        reply: `Here is your generated image for: "${cleanPrompt || text}". You can preview it, download it, or save it directly to your gallery.`,
        data: imageResult,
      };
    }

    // 2. CRICKET MATCHES & SCORECARD INTENT
    const cricketKeywords = [
      'cricket',
      'scorecard',
      'ind vs',
      'india vs',
      'afg',
      'pak',
      'aus',
      'eng',
      'live match',
      'current match',
      'match score',
      'icc',
      't20',
      'odi',
      'test match',
    ];
    const isCricketIntent = cricketKeywords.some((k) => lower.includes(k));

    if (isCricketIntent) {
      try {
        const matchesRes = await CricketService.getMatches('all');
        const matches: CricketMatch[] = matchesRes.matches || [];

        let activeMatch = matches.find((m: CricketMatch) => {
          const t1 = (m.team1.name + ' ' + (m.team1.shortName || '')).toLowerCase();
          const t2 = (m.team2.name + ' ' + (m.team2.shortName || '')).toLowerCase();
          const title = m.title.toLowerCase();

          if (lower.includes('ind') && lower.includes('afg')) {
            return (t1.includes('ind') && t2.includes('afg')) || (t1.includes('afg') && t2.includes('ind')) || title.includes('afg');
          }
          if (lower.includes('india') && lower.includes('afghanistan')) {
            return title.includes('india') && title.includes('afghanistan');
          }
          if (lower.includes('ind') && lower.includes('eng')) {
            return title.includes('eng');
          }
          if (lower.includes('aus') && lower.includes('eng')) {
            return title.includes('aus') || title.includes('eng');
          }
          return false;
        });

        if (!activeMatch) {
          activeMatch = matches.find((m: CricketMatch) => {
            const words = m.title.toLowerCase().split(/\s+/);
            return words.some((w: string) => w.length > 3 && lower.includes(w));
          });
        }

        if (!activeMatch && matches.length > 0) {
          activeMatch = matches.find((m: CricketMatch) => m.status === 'LIVE') || matches[0];
        }

        let detailedScorecard = null;
        if (activeMatch && (lower.includes('scorecard') || lower.includes('score') || lower.includes('vs'))) {
          try {
            detailedScorecard = await CricketService.getMatchScorecard(activeMatch.id, activeMatch.title);
          } catch (e) {
            console.warn('Could not fetch detailed scorecard for match', activeMatch.id, e);
          }
        }

        return {
          action: 'CRICKET',
          reply: activeMatch
            ? `Found international fixture: **${activeMatch.title}** (${activeMatch.statusText}). Here is the live status and scorecard breakdown:`
            : `Here are the latest official international cricket fixtures from ESPN Cricinfo:`,
          data: {
            matches: matches.slice(0, 8),
            activeMatch,
            scorecard: detailedScorecard,
          },
        };
      } catch (err: any) {
        return {
          action: 'GENERAL_CHAT',
          reply: `Could not retrieve live cricket data at this moment: ${err.message}`,
        };
      }
    }

    // 3. MUSIC PLAYBACK INTENT ("play DC songs", "play songs by ...", "play [song]")
    if (
      lower.startsWith('play ') ||
      lower.includes('play song') ||
      lower.includes('play songs') ||
      lower.includes('listen to') ||
      lower.includes('play music') ||
      lower.includes('play track')
    ) {
      if (!user) {
        return {
          action: 'AUTH_REQUIRED',
          reply: 'You must be logged in to listen to songs from your personal digital music vault.',
        };
      }

      let searchQuery = text
        .replace(/^(play songs from|play songs by|play song|play songs|play music|play track|play|listen to songs from|listen to songs by|listen to)\s*/i, '')
        .replace(/\s*(songs|song|music|track|tracks)$/i, '')
        .trim();

      let songs = await MusicService.getSongs(user, { search: searchQuery });

      if (songs.length === 0 && searchQuery) {
        songs = await MusicService.getSongs(user, { artist: searchQuery });
      }
      if (songs.length === 0 && searchQuery) {
        songs = await MusicService.getSongs(user, { album: searchQuery });
      }

      if (songs.length === 0 && (!searchQuery || searchQuery === 'all' || searchQuery === 'something')) {
        songs = await MusicService.getSongs(user, {});
      }

      if (songs.length > 0) {
        const firstSong = songs[0];
        return {
          action: 'PLAY_MUSIC',
          reply: `🎶 Now playing **"${firstSong.title}"**${
            firstSong.album ? ` from album/movie *${firstSong.album}*` : ''
          }${firstSong.artist ? ` by **${firstSong.artist}**` : ''}. Found ${songs.length} matching song(s) in your vault.`,
          data: {
            selectedSong: firstSong,
            queue: songs,
          },
        };
      } else {
        return {
          action: 'PLAY_MUSIC',
          reply: `I searched your personal music library for **"${searchQuery}"**, but couldn't find any matching songs, artist, or album. You can upload tracks in your **Music** section.`,
          data: {
            selectedSong: null,
            queue: [],
          },
        };
      }
    }

    // 4. CALENDAR EVENT INTENT ("add event for 17-09-2026 as my birthday", "schedule meeting on ...")
    if (
      lower.startsWith('add event') ||
      lower.startsWith('create event') ||
      lower.startsWith('schedule event') ||
      lower.startsWith('remind me') ||
      lower.includes('add event for') ||
      lower.includes('add an event')
    ) {
      if (!user) {
        return {
          action: 'AUTH_REQUIRED',
          reply: 'Authentication is required to add events to your personal calendar.',
        };
      }

      let parsedDate: Date | null = null;
      let dateMatch = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const year = parseInt(dateMatch[3], 10);
        parsedDate = new Date(year, month, day, 9, 0, 0);
      } else {
        const isoMatch = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
        if (isoMatch) {
          const year = parseInt(isoMatch[1], 10);
          const month = parseInt(isoMatch[2], 10) - 1;
          const day = parseInt(isoMatch[3], 10);
          parsedDate = new Date(year, month, day, 9, 0, 0);
        }
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
        parsedDate.setDate(parsedDate.getDate() + 1);
        parsedDate.setHours(9, 0, 0, 0);
      }

      let title = text
        .replace(/^(add event for|add an event for|add event|create event|schedule event|remind me to|schedule)\s*/i, '')
        .replace(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/g, '')
        .replace(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g, '')
        .replace(/^(on|for|at|as)\s*/i, '')
        .replace(/\s*(as|for|on)\s*$/i, '')
        .replace(/\s+as\s+/i, ' - ')
        .trim();

      if (!title) {
        title = 'New Event';
      }

      let eventType: CalendarEventType = CalendarEventType.REMINDER;
      if (lower.includes('birthday') || title.toLowerCase().includes('birthday')) {
        eventType = CalendarEventType.BIRTHDAY;
      } else if (lower.includes('study') || lower.includes('exam')) {
        eventType = CalendarEventType.STUDY;
      } else if (lower.includes('deadline')) {
        eventType = CalendarEventType.DEADLINE;
      } else if (lower.includes('task') || lower.includes('meeting')) {
        eventType = CalendarEventType.TASK;
      } else if (lower.includes('personal')) {
        eventType = CalendarEventType.PERSONAL;
      }

      const endDate = new Date(parsedDate.getTime() + 60 * 60 * 1000);

      try {
        const createdEvent = await CalendarService.createEvent(user.id, {
          title,
          type: eventType,
          startTime: parsedDate,
          endTime: endDate,
          allDay: eventType === CalendarEventType.BIRTHDAY,
          isImportant: eventType === CalendarEventType.BIRTHDAY || lower.includes('important'),
        });

        const formattedDate = parsedDate.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        return {
          action: 'CALENDAR_EVENT_ADDED',
          reply: `✅ Successfully added event **"${title}"** scheduled for **${formattedDate}** as a **${eventType}** in your Calendar.`,
          data: {
            event: createdEvent,
          },
        };
      } catch (err: any) {
        return {
          action: 'GENERAL_CHAT',
          reply: `Failed to create calendar event: ${err.message}`,
        };
      }
    }

    // 5. CALENDAR VIEW INTENT ("show my events", "what's on my calendar")
    if (lower.includes('my event') || lower.includes('my calendar') || lower.includes('upcoming events')) {
      if (!user) {
        return {
          action: 'AUTH_REQUIRED',
          reply: 'Authentication is required to view your calendar schedule.',
        };
      }

      const events = await CalendarService.getEvents(user.id, {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      return {
        action: 'CALENDAR_EVENTS_LIST',
        reply: `You have **${events.length}** upcoming event(s) in your Calendar:`,
        data: {
          events: events.slice(0, 10),
        },
      };
    }

    // 6. PRODUCT RETRIEVAL INTENT ("retrieve products pricing from 500 to 2000", "retrieve products by Apple")
    if (
      lower.includes('product') ||
      lower.includes('wishlist') ||
      lower.includes('pricing from') ||
      lower.includes('price from') ||
      lower.includes('products by')
    ) {
      if (!user) {
        return {
          action: 'AUTH_REQUIRED',
          reply: 'You must be logged in to view your saved product wishlist and price trackers.',
        };
      }

      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      const rangeMatch = text.match(/(?:from|between)\s*(\d+(?:\.\d+)?)\s*(?:to|and|-)\s*(\d+(?:\.\d+)?)/i);
      if (rangeMatch) {
        minPrice = parseFloat(rangeMatch[1]);
        maxPrice = parseFloat(rangeMatch[2]);
      } else {
        const underMatch = text.match(/(?:under|below|less than)\s*(\d+(?:\.\d+)?)/i);
        if (underMatch) {
          maxPrice = parseFloat(underMatch[1]);
        }
        const aboveMatch = text.match(/(?:above|over|more than)\s*(\d+(?:\.\d+)?)/i);
        if (aboveMatch) {
          minPrice = parseFloat(aboveMatch[1]);
        }
      }

      let brandQuery: string | undefined;
      const brandMatch = text.match(/(?:by|from|company|brand)\s+([a-zA-Z0-9\s]+?)(?:\s+pricing|\s+priced|\s+under|\s+between|$)/i);
      if (brandMatch && !['pricing', 'products', 'product'].includes(brandMatch[1].trim().toLowerCase())) {
        brandQuery = brandMatch[1].trim();
      }

      const whereClause: any = {
        userId: user.id,
      };

      if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.price = {};
        if (minPrice !== undefined) whereClause.price.gte = minPrice;
        if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
      }

      if (brandQuery) {
        whereClause.OR = [
          { brand: { contains: brandQuery, mode: 'insensitive' } },
          { store: { contains: brandQuery, mode: 'insensitive' } },
          { title: { contains: brandQuery, mode: 'insensitive' } },
        ];
      }

      const products = await prisma.savedProduct.findMany({
        where: whereClause,
        orderBy: { price: 'asc' },
      });

      const filterSummary = [
        minPrice !== undefined || maxPrice !== undefined
          ? `pricing ${minPrice !== undefined ? `from ₹${minPrice}` : ''} ${
              maxPrice !== undefined ? `to ₹${maxPrice}` : ''
            }`
          : '',
        brandQuery ? `by "${brandQuery}"` : '',
      ]
        .filter(Boolean)
        .join(' ');

      return {
        action: 'PRODUCTS_RETRIEVED',
        reply:
          products.length > 0
            ? `Found **${products.length}** saved product(s)${filterSummary ? ` matching ${filterSummary}` : ''} in your wishlist:`
            : `No saved products found in your wishlist${filterSummary ? ` matching ${filterSummary}` : ''}. You can save items from Amazon, Flipkart, or any online store in the Products section.`,
        data: {
          products,
          minPrice,
          maxPrice,
          brand: brandQuery,
        },
      };
    }

    // 7. FAVORITES INTENT ("add ... to favorites", "remove from favorites", "show my favorites")
    if (lower.includes('favorite') || lower.includes('favourite')) {
      if (!user) {
        return {
          action: 'AUTH_REQUIRED',
          reply: 'Authentication is required to view and manage your favorites.',
        };
      }

      if (lower.includes('add') || lower.includes('mark') || lower.includes('star')) {
        const fileQuery = text
          .replace(/^(add|mark|put)\s*/i, '')
          .replace(/\s*(to|in|as)\s*(favorites|favourites|favorite|favourite).*$/i, '')
          .trim();

        if (fileQuery) {
          const file = await prisma.file.findFirst({
            where: {
              userId: user.id,
              deletedAt: null,
              originalName: { contains: fileQuery, mode: 'insensitive' },
            },
          });

          if (file) {
            await FavoriteService.toggleFavorite(file.id, user);
            return {
              action: 'FAVORITE_UPDATED',
              reply: `⭐ **${file.originalName}** has been added to your Favorites.`,
              data: { file, isFavorite: true },
            };
          }
        }
      } else if (lower.includes('remove') || lower.includes('unstar') || lower.includes('delete from favorite')) {
        const fileQuery = text
          .replace(/^(remove|delete)\s*/i, '')
          .replace(/\s*(from|in)\s*(favorites|favourites|favorite|favourite).*$/i, '')
          .trim();

        if (fileQuery) {
          const file = await prisma.file.findFirst({
            where: {
              userId: user.id,
              deletedAt: null,
              originalName: { contains: fileQuery, mode: 'insensitive' },
            },
          });

          if (file) {
            await FavoriteService.toggleFavorite(file.id, user);
            return {
              action: 'FAVORITE_UPDATED',
              reply: `Removed **${file.originalName}** from your Favorites.`,
              data: { file, isFavorite: false },
            };
          }
        }
      }

      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        include: {
          file: {
            select: {
              id: true,
              originalName: true,
              fileType: true,
              mimeType: true,
              size: true,
              createdAt: true,
            },
          },
        },
      });

      return {
        action: 'FAVORITES_LIST',
        reply: `You have **${favorites.length}** item(s) in your Favorites:`,
        data: {
          favorites: favorites.map((f) => ({
            ...f.file,
            size: Number(f.file.size),
          })),
        },
      };
    }

    // 8. FILE RETRIEVAL INTENT (Images, Videos, PDFs, Docs, etc.)
    const fileKeywords = [
      'retrieve',
      'show my',
      'get my',
      'find my',
      'list my',
      'search file',
      'files',
      'pdf',
      'doc',
      'docx',
      'video',
      'videos',
      'photo',
      'photos',
      'image',
      'images',
      'document',
      'documents',
    ];
    if (fileKeywords.some((k) => lower.includes(k))) {
      if (!user) {
        return {
          action: 'AUTH_REQUIRED',
          reply: 'Authentication is required to search and retrieve your private documents and media.',
        };
      }

      let fileTypeFilter: FileType | undefined;

      if (lower.includes('pdf')) {
        fileTypeFilter = FileType.PDF;
      } else if (lower.includes('photo') || lower.includes('image') || lower.includes('picture')) {
        fileTypeFilter = FileType.IMAGE;
      } else if (lower.includes('video') || lower.includes('movie') || lower.includes('clip')) {
        fileTypeFilter = FileType.VIDEO;
      } else if (lower.includes('doc') || lower.includes('word') || lower.includes('document')) {
        fileTypeFilter = FileType.DOCUMENT;
      }

      let searchName = text
        .replace(/^(retrieve|show my|get my|find my|list my|search file|show|find|get)\s*/i, '')
        .replace(/\s*(files|file|documents|document|photos|photo|images|image|videos|video|pdfs|pdf)$/i, '')
        .trim();

      const whereClause: any = {
        userId: user.id,
        deletedAt: null,
        isSecret: false,
      };

      if (fileTypeFilter) {
        whereClause.fileType = fileTypeFilter;
      }

      if (searchName && searchName.length > 1 && !['all', 'my', 'the'].includes(searchName.toLowerCase())) {
        whereClause.originalName = { contains: searchName, mode: 'insensitive' };
      }

      const files = await prisma.file.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          originalName: true,
          fileType: true,
          mimeType: true,
          extension: true,
          size: true,
          createdAt: true,
          tags: true,
        },
      });

      return {
        action: 'FILES_RETRIEVED',
        reply:
          files.length > 0
            ? `Found **${files.length}** file(s) in your personal library matching your request:`
            : `No matching files found in your library.`,
        data: {
          files: files.map((f) => ({
            ...f,
            size: Number(f.size),
            downloadUrl: `/api/files/${f.id}/download`,
            streamUrl: `/api/files/${f.id}/stream`,
            thumbnailUrl: `/api/files/${f.id}/thumbnail`,
          })),
        },
      };
    }

    // 9. GENERAL CHAT / FALLBACK ASSISTANT
    return {
      action: 'GENERAL_CHAT',
      reply: `Hello! I am your AI Assistant for your Personal Digital Library. Here are things you can ask me to do:
- 🎶 **Play Music**: *"play DC songs"*, *"play Believer"*, *"play songs by Arijit Singh"*
- 🏏 **Cricket Live**: *"IND vs AFG scorecard"*, *"current cricket matches"*
- 🎨 **Image Generation**: *"generate image of a cyberpunk skyline at night"*
- 📅 **Calendar**: *"add event for 17-09-2026 as my birthday"*, *"show my events"*
- 📄 **Files & Media**: *"retrieve my pdf files"*, *"show my photos"*, *"find my videos"*
- 🛍️ **Products**: *"retrieve products pricing from 500 to 2000"*, *"products by Apple"*
- ⭐ **Favorites**: *"add project.pdf to favorites"*, *"show my favorites"*

How can I help you today?`,
    };
  }
}
