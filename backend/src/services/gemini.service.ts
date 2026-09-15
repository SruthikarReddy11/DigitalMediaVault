import { config } from '../config';
import { AuthUser } from '../types';
import { prisma } from '../database/prisma';
import { MusicService } from './music.service';
import { CalendarService } from './calendar.service';
import { FavoriteService } from './favorite.service';
import { CricketService, CricketMatch } from './cricket.service';
import { CalendarEventType, FileType } from '@prisma/client';

export interface GeminiChatTurn {
  role: 'user' | 'model';
  parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }>;
}

export interface GeminiExecutionResult {
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

export class GeminiService {
  private static readonly MODELS = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
  ];

  /**
   * Tool definitions exposed to Gemini for interacting with the user's digital media vault
   */
  private static getToolDeclarations() {
    return [
      {
        name: 'play_music',
        description: 'Play, queue, or search for music/songs from the user’s personal digital audio library by title, artist, album, or general mood/query.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Title of the song, artist name, album, or keywords (e.g. "Believer", "Arijit Singh", "DC").',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_cricket_scores',
        description: 'Retrieve live cricket scores, recent match results, upcoming fixtures, or detailed scorecard breakdown.',
        parameters: {
          type: 'OBJECT',
          properties: {
            teamOrMatch: {
              type: 'STRING',
              description: 'Optional team name or match fixture to look up (e.g. "India", "IND vs AFG", "Australia").',
            },
          },
        },
      },
      {
        name: 'create_calendar_event',
        description: 'Add or schedule a new event, reminder, birthday, study session, meeting, or deadline in the user’s personal calendar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'Event title or reminder description.',
            },
            date: {
              type: 'STRING',
              description: 'Event date in YYYY-MM-DD format (e.g. "2026-09-17"). If a relative date like "tomorrow" is mentioned, resolve it to YYYY-MM-DD.',
            },
            time: {
              type: 'STRING',
              description: 'Optional start time in HH:mm 24-hour format (e.g. "14:30") or default to "09:00".',
            },
            eventType: {
              type: 'STRING',
              enum: ['REMINDER', 'BIRTHDAY', 'STUDY', 'DEADLINE', 'TASK', 'PERSONAL'],
              description: 'Type classification for the calendar event.',
            },
            isImportant: {
              type: 'BOOLEAN',
              description: 'Flag if the event is high-priority or important.',
            },
          },
          required: ['title', 'date'],
        },
      },
      {
        name: 'get_calendar_events',
        description: 'Retrieve upcoming events, schedule, or reminders currently saved on the user’s calendar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            limit: {
              type: 'INTEGER',
              description: 'Maximum number of events to fetch (default is 10).',
            },
          },
        },
      },
      {
        name: 'search_files',
        description: 'Search and retrieve uploaded documents, PDFs, photos, images, or videos from the user’s private library.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Keywords or file name to search for (e.g. "invoice", "resume", "project").',
            },
            fileType: {
              type: 'STRING',
              enum: ['ALL', 'IMAGE', 'VIDEO', 'DOCUMENT', 'PDF', 'AUDIO'],
              description: 'Filter search by file type.',
            },
          },
        },
      },
      {
        name: 'search_products',
        description: 'Filter and view items saved in the user’s product wishlist and price tracker by price range, brand, or title.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Product name or keywords to search for.',
            },
            brand: {
              type: 'STRING',
              description: 'Brand or store name (e.g. "Apple", "Samsung", "Amazon").',
            },
            minPrice: {
              type: 'NUMBER',
              description: 'Minimum price filter in rupees.',
            },
            maxPrice: {
              type: 'NUMBER',
              description: 'Maximum price filter in rupees.',
            },
          },
        },
      },
      {
        name: 'manage_favorites',
        description: 'Manage favorite items: list favorites, star a file, or remove an item from favorites.',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: {
              type: 'STRING',
              enum: ['list', 'add', 'remove'],
              description: 'Action to perform: list, add, or remove.',
            },
            fileName: {
              type: 'STRING',
              description: 'Name or keyword of the file to star or unstar.',
            },
          },
          required: ['action'],
        },
      },
    ];
  }

  /**
   * Helper to perform Gemini API call with fallback model
   */
  private static async callGeminiApi(
    apiKey: string,
    modelName: string,
    requestBody: any
  ): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error (${res.status} ${res.statusText}): ${errorText}`);
    }

    return await res.json();
  }

  /**
   * Execute tool call dispatched by Gemini
   */
  private static async executeTool(
    toolName: string,
    args: any,
    user?: AuthUser | null
  ): Promise<{ action: GeminiExecutionResult['action']; data: any; summary: string }> {
    switch (toolName) {
      case 'play_music': {
        if (!user) {
          return {
            action: 'AUTH_REQUIRED',
            data: null,
            summary: 'User must be authenticated to access their personal music vault.',
          };
        }

        const searchQuery = (args.query || '').trim();
        let songs = await MusicService.getSongs(user, { search: searchQuery });

        if (songs.length === 0 && searchQuery) {
          songs = await MusicService.getSongs(user, { artist: searchQuery });
        }
        if (songs.length === 0 && searchQuery) {
          songs = await MusicService.getSongs(user, { album: searchQuery });
        }
        if (songs.length === 0 && (!searchQuery || searchQuery.toLowerCase() === 'all')) {
          songs = await MusicService.getSongs(user, {});
        }

        if (songs.length > 0) {
          const firstSong = songs[0];
          return {
            action: 'PLAY_MUSIC',
            data: { selectedSong: firstSong, queue: songs },
            summary: `Found ${songs.length} song(s). Playing "${firstSong.title}" by ${firstSong.artist || 'Unknown'}.`,
          };
        } else {
          return {
            action: 'PLAY_MUSIC',
            data: { selectedSong: null, queue: [] },
            summary: `No songs found matching "${searchQuery}" in your vault.`,
          };
        }
      }

      case 'get_cricket_scores': {
        try {
          const matchesRes = await CricketService.getMatches('all');
          const matches: CricketMatch[] = matchesRes.matches || [];
          const query = (args.teamOrMatch || '').toLowerCase().trim();

          let activeMatch: CricketMatch | undefined;

          if (query) {
            activeMatch = matches.find((m: CricketMatch) => {
              const t1 = (m.team1.name + ' ' + (m.team1.shortName || '')).toLowerCase();
              const t2 = (m.team2.name + ' ' + (m.team2.shortName || '')).toLowerCase();
              const title = m.title.toLowerCase();
              return t1.includes(query) || t2.includes(query) || title.includes(query);
            });
          }

          if (!activeMatch && matches.length > 0) {
            activeMatch = matches.find((m: CricketMatch) => m.status === 'LIVE') || matches[0];
          }

          let detailedScorecard = null;
          if (activeMatch) {
            try {
              detailedScorecard = await CricketService.getMatchScorecard(activeMatch.id, activeMatch.title);
            } catch (e) {
              console.warn('Could not fetch detailed scorecard:', e);
            }
          }

          return {
            action: 'CRICKET',
            data: {
              matches: matches.slice(0, 8),
              activeMatch: activeMatch || null,
              scorecard: detailedScorecard,
            },
            summary: activeMatch
              ? `Found match: ${activeMatch.title} (${activeMatch.statusText}). Score: ${activeMatch.team1.name} ${activeMatch.team1.score || 'yet to bat'} vs ${activeMatch.team2.name} ${activeMatch.team2.score || 'yet to bat'}.`
              : `Found ${matches.length} matches from ESPN Cricinfo.`,
          };
        } catch (err: any) {
          return {
            action: 'GENERAL_CHAT',
            data: null,
            summary: `Failed to fetch live cricket data: ${err.message}`,
          };
        }
      }

      case 'create_calendar_event': {
        if (!user) {
          return {
            action: 'AUTH_REQUIRED',
            data: null,
            summary: 'User must be authenticated to add events to the calendar.',
          };
        }

        const { title, date, time, eventType, isImportant } = args;
        let eventDate: Date;

        try {
          if (time) {
            eventDate = new Date(`${date}T${time}:00`);
          } else {
            eventDate = new Date(`${date}T09:00:00`);
          }
          if (isNaN(eventDate.getTime())) {
            eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + 1);
          }
        } catch {
          eventDate = new Date();
          eventDate.setDate(eventDate.getDate() + 1);
        }

        const classifiedType: CalendarEventType =
          (eventType as CalendarEventType) || CalendarEventType.REMINDER;
        const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);

        const createdEvent = await CalendarService.createEvent(user.id, {
          title: title || 'New Scheduled Event',
          type: classifiedType,
          startTime: eventDate,
          endTime: endDate,
          allDay: classifiedType === CalendarEventType.BIRTHDAY,
          isImportant: Boolean(isImportant || classifiedType === CalendarEventType.BIRTHDAY),
        });

        return {
          action: 'CALENDAR_EVENT_ADDED',
          data: { event: createdEvent },
          summary: `Successfully created event "${title}" on ${eventDate.toLocaleDateString()} as a ${classifiedType}.`,
        };
      }

      case 'get_calendar_events': {
        if (!user) {
          return {
            action: 'AUTH_REQUIRED',
            data: null,
            summary: 'User must be logged in to view calendar schedule.',
          };
        }

        const events = await CalendarService.getEvents(user.id, {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        });

        const limit = args.limit || 10;
        return {
          action: 'CALENDAR_EVENTS_LIST',
          data: { events: events.slice(0, limit) },
          summary: `Found ${events.length} upcoming calendar event(s).`,
        };
      }

      case 'search_files': {
        if (!user) {
          return {
            action: 'AUTH_REQUIRED',
            data: null,
            summary: 'Authentication required to search private vault files.',
          };
        }

        const query = (args.query || '').trim();
        const fileTypeArg = (args.fileType || 'ALL').toUpperCase();

        const whereClause: any = {
          userId: user.id,
          deletedAt: null,
          isSecret: false,
        };

        if (fileTypeArg !== 'ALL' && (FileType as any)[fileTypeArg]) {
          whereClause.fileType = fileTypeArg as FileType;
        }

        if (query && query.length > 1 && !['all', 'files', 'my'].includes(query.toLowerCase())) {
          whereClause.originalName = { contains: query, mode: 'insensitive' };
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
          data: {
            files: files.map((f) => ({
              ...f,
              size: Number(f.size),
              downloadUrl: `/api/files/${f.id}/download`,
              streamUrl: `/api/files/${f.id}/stream`,
              thumbnailUrl: `/api/files/${f.id}/thumbnail`,
            })),
          },
          summary: `Found ${files.length} file(s) matching request.`,
        };
      }

      case 'search_products': {
        if (!user) {
          return {
            action: 'AUTH_REQUIRED',
            data: null,
            summary: 'Authentication required to access saved products wishlist.',
          };
        }

        const whereClause: any = { userId: user.id };
        const minPrice = args.minPrice !== undefined ? Number(args.minPrice) : undefined;
        const maxPrice = args.maxPrice !== undefined ? Number(args.maxPrice) : undefined;
        const brand = args.brand ? String(args.brand).trim() : undefined;
        const query = args.query ? String(args.query).trim() : undefined;

        if (minPrice !== undefined || maxPrice !== undefined) {
          whereClause.price = {};
          if (minPrice !== undefined) whereClause.price.gte = minPrice;
          if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
        }

        const searchCriteria: any[] = [];
        if (brand) {
          searchCriteria.push(
            { brand: { contains: brand, mode: 'insensitive' } },
            { store: { contains: brand, mode: 'insensitive' } }
          );
        }
        if (query) {
          searchCriteria.push(
            { title: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } }
          );
        }
        if (searchCriteria.length > 0) {
          whereClause.OR = searchCriteria;
        }

        const products = await prisma.savedProduct.findMany({
          where: whereClause,
          orderBy: { price: 'asc' },
        });

        return {
          action: 'PRODUCTS_RETRIEVED',
          data: { products, minPrice, maxPrice, brand: brand || query },
          summary: `Found ${products.length} saved product(s) in wishlist.`,
        };
      }

      case 'manage_favorites': {
        if (!user) {
          return {
            action: 'AUTH_REQUIRED',
            data: null,
            summary: 'Authentication required to manage favorites.',
          };
        }

        const action = args.action || 'list';
        const fileName = (args.fileName || '').trim();

        if (action === 'add' || action === 'remove') {
          if (fileName) {
            const file = await prisma.file.findFirst({
              where: {
                userId: user.id,
                deletedAt: null,
                originalName: { contains: fileName, mode: 'insensitive' },
              },
            });

            if (file) {
              const res = await FavoriteService.toggleFavorite(file.id, user);
              return {
                action: 'FAVORITE_UPDATED',
                data: { file, isFavorite: res.isFavorite },
                summary: res.isFavorite
                  ? `Added "${file.originalName}" to your favorites.`
                  : `Removed "${file.originalName}" from your favorites.`,
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
          data: {
            favorites: favorites.map((f) => ({
              ...f.file,
              size: Number(f.file.size),
            })),
          },
          summary: `You have ${favorites.length} item(s) in your favorites list.`,
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Main entry point to process a chat prompt with Google Gemini
   */
  public static async processWithGemini(
    prompt: string,
    user?: AuthUser | null,
    conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>
  ): Promise<GeminiExecutionResult> {
    const apiKey = config.geminiApiKey;

    // If no API key configured, guide the user cleanly
    if (!apiKey) {
      return {
        action: 'GENERAL_CHAT',
        reply: `⚠️ **Google Gemini API Key is not configured on the server.**\n\nTo enable conversational chat, intelligent task understanding, and new feature execution, please add your single Gemini API key to your backend environment file:\n\n1. Open \`backend/.env\`\n2. Add: \`GEMINI_API_KEY="AIzaSy..."\`\n3. Restart the backend server.\n\nYou can generate a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).`,
      };
    }

    const todayDateStr = new Date().toISOString().split('T')[0];
    const systemInstructionText = `You are the versatile AI Assistant for "VaultX" (Personal Digital Library & Media Vault).
Current date: ${todayDateStr}.
You have access to tools that can interact with the user's digital media vault:
- play_music: search and play music/songs
- get_cricket_scores: live cricket scores, fixtures, and scorecards
- create_calendar_event: schedule reminders, birthdays, meetings, deadlines
- get_calendar_events: view upcoming events
- search_files: search documents, PDFs, photos, and videos
- search_products: search saved wishlist products and price trackers
- manage_favorites: add, remove, or list favorites

IMPORTANT GUIDELINES:
1. When the user asks you to perform a task related to their vault (like playing music, checking cricket, adding an event, finding files, checking products, or managing favorites), ALWAYS call the appropriate tool.
2. If the user asks ANY newly asked task, general question, conversation, explanation, advice, coding, brainstorming, or writing task that does not require vault tools, answer thoroughly, helpfully, and conversationally in Markdown format without calling any tool.
3. Note: Image generation is completely removed and unsupported. If asked to generate images, inform the user politely that image generation is not available.
4. Keep your responses clear, helpful, and friendly.`;

    // Prepare contents array with optional conversation history
    const contents: any[] = [];

    if (Array.isArray(conversationHistory)) {
      for (const turn of conversationHistory.slice(-6)) {
        if (turn.text && turn.text.trim()) {
          contents.push({
            role: turn.role === 'model' ? 'model' : 'user',
            parts: [{ text: turn.text.trim() }],
          });
        }
      }
    }

    // Append the current prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt.trim() }],
    });

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }],
      },
      contents,
      tools: [
        {
          functionDeclarations: this.getToolDeclarations(),
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    let responseData: any;
    let activeModel = this.MODELS[0];
    let lastError: Error | null = null;

    for (const modelName of this.MODELS) {
      try {
        responseData = await this.callGeminiApi(apiKey, modelName, requestBody);
        activeModel = modelName;
        break;
      } catch (err: any) {
        console.warn(`Gemini model ${modelName} encountered error:`, err.message);
        lastError = err;
      }
    }

    if (!responseData) {
      console.error('All Gemini API model calls failed:', lastError);
      throw new Error(`Gemini service error: ${lastError?.message || 'Unable to connect to Gemini API.'}`);
    }

    const candidate = responseData?.candidates?.[0];
    const candidateParts = candidate?.content?.parts || [];

    // Check if Gemini invoked a function call
    const functionCallPart = candidateParts.find((p: any) => p.functionCall);

    if (functionCallPart && functionCallPart.functionCall) {
      const { name, args, id: callId } = functionCallPart.functionCall;
      try {
        const toolResult = await this.executeTool(name, args || {}, user);

        // Turn 2: Provide tool output back to Gemini to get a natural conversational summary
        // Preserving full candidateParts (thoughtSignature) is required for Gemini 3.x
        const followUpContents = [
          ...contents,
          {
            role: 'model',
            parts: candidateParts,
          },
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name,
                  response: {
                    content: toolResult.summary,
                  },
                  id: callId,
                },
              },
            ],
          },
        ];

        let followUpReply = toolResult.summary;
        try {
          const followUpRes = await this.callGeminiApi(apiKey, activeModel, {
            systemInstruction: { parts: [{ text: systemInstructionText }] },
            contents: followUpContents,
          });
          const followUpCandidate = followUpRes?.candidates?.[0];
          const textPart = followUpCandidate?.content?.parts?.find((p: any) => p.text);
          if (textPart && textPart.text) {
            followUpReply = textPart.text.trim();
          }
        } catch (fErr) {
          // If second turn fails, fall back to tool summary
          console.warn('Gemini follow-up turn error, using tool summary:', fErr);
        }

        return {
          action: toolResult.action,
          reply: followUpReply,
          data: toolResult.data,
        };
      } catch (toolErr: any) {
        console.error(`Error executing tool ${name}:`, toolErr);
        return {
          action: 'GENERAL_CHAT',
          reply: `I tried to execute **${name}**, but encountered an error: ${toolErr.message}`,
        };
      }
    }

    // No tool call -> standard conversational response
    const textPart = candidateParts.find((p: any) => p.text);
    const replyText = textPart?.text?.trim() || 'I could not generate a response. Please try again.';

    return {
      action: 'GENERAL_CHAT',
      reply: replyText,
    };
  }
}
