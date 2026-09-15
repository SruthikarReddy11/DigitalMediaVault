import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { config } from '../config';
import { GeminiService } from './gemini.service';
import { MusicService } from './music.service';
import { CalendarService } from './calendar.service';
import { FavoriteService } from './favorite.service';
import { CricketService, CricketMatch } from './cricket.service';
import { CalendarEventType, FileType } from '@prisma/client';

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
    | 'AUTH_REQUIRED';
  reply: string;
  data?: any;
}

export class AiService {
  /**
   * Process a natural language prompt using Google Gemini API
   * with automatic fallback to local rule execution if the API key is not yet set.
   */
  public static async processPrompt(
    prompt: string,
    user?: AuthUser | null,
    conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>
  ): Promise<AiActionResult> {
    const text = prompt.trim();

    // 1. If Gemini API key is configured, let Gemini handle the prompt with tool calling & intelligent chat
    if (config.geminiApiKey) {
      try {
        const geminiResult = await GeminiService.processWithGemini(text, user, conversationHistory);
        return geminiResult;
      } catch (err: any) {
        console.error('Gemini processing failed, attempting local rule fallback:', err.message);
        // If a specific local command matches (music, cricket, etc.), execute it locally
        const localResult = await this.processPromptLocally(text, user);
        if (localResult.action !== 'GENERAL_CHAT') {
          return localResult;
        }
        // If casual conversation or non-rule prompt failed
        return {
          action: 'GENERAL_CHAT',
          reply: `⚠️ I had trouble connecting to Gemini AI right now: ${err.message || 'Service temporarily unavailable'}. Please try again in a moment.`,
        };
      }
    }

    // 2. LOCAL RULE FALLBACK (used when GEMINI_API_KEY is not configured)
    return this.processPromptLocally(text, user);
  }

  /**
   * Local rule-based fallback processor
   */
  private static async processPromptLocally(
    text: string,
    user?: AuthUser | null
  ): Promise<AiActionResult> {
    const lower = text.toLowerCase();

    // 1. CRICKET MATCHES & SCORECARD INTENT
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
            ? `Found international fixture: **${activeMatch.title}** (${activeMatch.statusText}). Live scorecard breakdown:`
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

    // 2. MUSIC PLAYBACK INTENT
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

      const searchQuery = text
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

    // 3. CALENDAR EVENT INTENT
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
      const dateMatch = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
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

    // 4. CALENDAR VIEW INTENT
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

    // 5. PRODUCT RETRIEVAL INTENT
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

      const whereClause: any = { userId: user.id };

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

      return {
        action: 'PRODUCTS_RETRIEVED',
        reply:
          products.length > 0
            ? `Found **${products.length}** saved product(s) in your wishlist:`
            : `No saved products found in your wishlist.`,
        data: { products, minPrice, maxPrice, brand: brandQuery },
      };
    }

    // 6. FAVORITES INTENT
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

    // 7. FILE RETRIEVAL INTENT
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

      const searchName = text
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

    // 8. FALLBACK WHEN NO KEY AND NO RULE MATCHES
    return {
      action: 'GENERAL_CHAT',
      reply: `👋 Hello! I am your AI Assistant for VaultX.\n\nTo enable conversational chat, answer any questions, and perform newly asked tasks with Google Gemini, please configure your single \`GEMINI_API_KEY\` in \`backend/.env\`.\n\nPredefined tasks you can run right now:\n- 🎶 **Play Music**: *"play DC songs"*, *"play Believer"*\n- 🏏 **Cricket Live**: *"IND vs AFG scorecard"*, *"live matches"*\n- 📅 **Calendar**: *"add event for 17-09-2026 as my birthday"*\n- 📄 **Files & Media**: *"retrieve my pdf files"*, *"find my videos"*\n- 🛍️ **Products**: *"retrieve products pricing from 500 to 2000"*\n- ⭐ **Favorites**: *"show my favorites"*`,
    };
  }
}
