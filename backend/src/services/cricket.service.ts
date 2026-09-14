import https from 'https';

export interface CricketTeamScore {
  name: string;
  shortName?: string;
  img?: string;
  score: string;
  overs?: string;
  isBatting: boolean;
}

export interface CricketMatch {
  id: string;
  title: string;
  matchType?: string; // 't20' | 'odi' | 'test'
  status: 'LIVE' | 'COMPLETED' | 'UPCOMING';
  statusText: string;
  venue?: string;
  dateTimeGMT?: string;
  cricinfoLink?: string;
  hasScorecard?: boolean;
  team1: CricketTeamScore;
  team2: CricketTeamScore;
}

export interface CricketMatchesResponse {
  success: boolean;
  provider: string;
  totalCount: number;
  liveCount: number;
  upcomingCount: number;
  completedCount: number;
  lastUpdated: string;
  isCached?: boolean;
  matches: CricketMatch[];
}

export interface ScorecardBatsman {
  id: number | string;
  name: string;
  isCaptain?: boolean;
  isKeeper?: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  outDesc: string;
  isNotOut: boolean;
}

export interface ScorecardBowler {
  id: number | string;
  name: string;
  overs: string | number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number | string;
  wides?: number;
  noBalls?: number;
}

export interface ScorecardInnings {
  inningsId: number;
  teamName: string;
  teamShortName: string;
  runs: number;
  wickets: number;
  overs: number;
  runRate?: number;
  batsmen: ScorecardBatsman[];
  bowlers: ScorecardBowler[];
  extras?: {
    total: number;
    byes?: number;
    legByes?: number;
    wides?: number;
    noBalls?: number;
  };
}

export interface DetailedScorecardResult {
  success: boolean;
  provider?: string;
  matchTitle: string;
  status: string;
  seriesName?: string;
  venue?: string;
  dateTimeGMT?: string;
  matchType?: string;
  toss?: string;
  result?: string;
  innings: ScorecardInnings[];
  isFallback?: boolean;
}

// In-memory cache structures
interface CacheEntry<T> {
  expiry: number;
  data: T;
}

let cachedMatchesList: CacheEntry<CricketMatch[]> | null = null;
const scorecardCache = new Map<string, CacheEntry<DetailedScorecardResult>>();

// Match index cache for Cricbuzz detailed scorecards
let cricbuzzMatchIndex: Map<string, string> | null = null;
let cricbuzzIndexExpiry = 0;

const MATCHES_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const SCORECARD_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class CricketService {
  private static BASE_URL = 'https://api.cricapi.com/v1';

  private static getApiKey(): string {
    return (process.env.CRICAPI_KEY || '84b6199a-37a3-4e3a-b62b-8d34a9d83bc2').trim();
  }

  /**
   * Fetch URL with user agent and timeout
   */
  private static fetchUrl<T = string>(url: string, asJson = false, timeoutMs = 10000): Promise<T> {
    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: asJson
              ? 'application/json, text/plain, */*'
              : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: timeoutMs,
        },
        (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              if (asJson) {
                const json = JSON.parse(data);
                resolve(json as T);
              } else {
                resolve(data as unknown as T);
              }
            } catch (err) {
              if (asJson) reject(err);
              else resolve(data as unknown as T);
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout fetching ${url}`));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Fetches all matches (Live, Upcoming, and Completed)
   */
  public static async getMatches(
    type: 'all' | 'live' | 'upcoming' | 'completed' = 'all'
  ): Promise<CricketMatchesResponse> {
    const now = Date.now();
    let matches: CricketMatch[] = [];
    let isCached = false;

    if (cachedMatchesList && cachedMatchesList.expiry > now) {
      matches = cachedMatchesList.data;
      isCached = true;
    } else {
      const apiKey = this.getApiKey();
      const currentUrl =
        process.env.CRICAPI_CURRENT_MATCHES_URL || `${this.BASE_URL}/currentMatches`;
      const matchesUrl =
        process.env.CRICAPI_MATCHES_URL || `${this.BASE_URL}/matches`;
      const scoreUrl =
        process.env.CRICAPI_CRIC_SCORE_URL || `${this.BASE_URL}/cricScore`;

      const matchMap = new Map<string, CricketMatch>();

      try {
        // Query user's 3 CricAPI feeds
        const [currentRes, matchesRes, scoreRes] = await Promise.allSettled([
          this.fetchUrl<any>(`${currentUrl}?apikey=${apiKey}&offset=0`, true),
          this.fetchUrl<any>(`${matchesUrl}?apikey=${apiKey}&offset=0`, true),
          this.fetchUrl<any>(`${scoreUrl}?apikey=${apiKey}`, true),
        ]);

        // Check if CricAPI returned hit limits or errors
        const hasCricApiHits =
          (currentRes.status === 'fulfilled' && currentRes.value?.status === 'success') ||
          (matchesRes.status === 'fulfilled' && matchesRes.value?.status === 'success') ||
          (scoreRes.status === 'fulfilled' && scoreRes.value?.status === 'success');

        if (hasCricApiHits) {
          // 1. Process currentMatches
          if (currentRes.status === 'fulfilled' && currentRes.value?.data) {
            currentRes.value.data.forEach((m: any) => {
              if (m?.id) matchMap.set(m.id, this.mapCurrentOrScheduleMatch(m));
            });
          }

          // 2. Process matches
          if (matchesRes.status === 'fulfilled' && matchesRes.value?.data) {
            matchesRes.value.data.forEach((m: any) => {
              if (m?.id && !matchMap.has(m.id)) {
                matchMap.set(m.id, this.mapCurrentOrScheduleMatch(m));
              }
            });
          }

          // 3. Process cricScore
          if (scoreRes.status === 'fulfilled' && scoreRes.value?.data) {
            scoreRes.value.data.forEach((sc: any) => {
              if (!sc?.id) return;
              if (!matchMap.has(sc.id)) {
                matchMap.set(sc.id, this.mapCricScoreItem(sc));
              } else {
                const existing = matchMap.get(sc.id)!;
                if (!existing.team1.img && sc.t1img) existing.team1.img = sc.t1img;
                if (!existing.team2.img && sc.t2img) existing.team2.img = sc.t2img;
                if (!existing.team1.score && sc.t1s) existing.team1.score = sc.t1s;
                if (!existing.team2.score && sc.t2s) existing.team2.score = sc.t2s;
              }
            });
          }
        }
      } catch (err) {
        console.warn('[CricketService] Error fetching CricAPI feeds:', err);
      }

      // If CricAPI was exhausted or returned empty, ingest live matches index
      if (matchMap.size === 0) {
        const liveIndexMatches = await this.fetchLiveMatchesFromIndex();
        liveIndexMatches.forEach((m) => matchMap.set(m.id, m));
      }

      matches = Array.from(matchMap.values());

      if (matches.length > 0) {
        cachedMatchesList = {
          expiry: now + MATCHES_CACHE_TTL_MS,
          data: matches,
        };
      }
    }

    let filtered = matches;
    if (type === 'live') {
      filtered = matches.filter((m) => m.status === 'LIVE');
    } else if (type === 'upcoming') {
      filtered = matches.filter((m) => m.status === 'UPCOMING');
    } else if (type === 'completed') {
      filtered = matches.filter((m) => m.status === 'COMPLETED');
    }

    const liveCount = matches.filter((m) => m.status === 'LIVE').length;
    const upcomingCount = matches.filter((m) => m.status === 'UPCOMING').length;
    const completedCount = matches.filter((m) => m.status === 'COMPLETED').length;

    return {
      success: true,
      provider: 'CricketData.org (CricAPI)',
      totalCount: filtered.length,
      liveCount,
      upcomingCount,
      completedCount,
      lastUpdated: new Date().toISOString(),
      isCached,
      matches: filtered,
    };
  }

  /**
   * Backwards-compatible getLiveScores
   */
  public static async getLiveScores() {
    const res = await this.getMatches('live');
    return {
      success: true,
      count: res.matches.length,
      lastUpdated: res.lastUpdated,
      matches: res.matches,
      isCached: res.isCached,
    };
  }

  /**
   * Detailed Scorecard for any match:
   * 1. Resolves official ball-by-ball player scorecard with real batter & bowler names
   * 2. Checks CricAPI match_scorecard
   */
  public static async getMatchScorecard(
    matchId?: string,
    title?: string
  ): Promise<DetailedScorecardResult> {
    const now = Date.now();
    const cleanTitle = title || '';
    const cacheKey = matchId || cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (cacheKey && scorecardCache.has(cacheKey)) {
      const entry = scorecardCache.get(cacheKey)!;
      if (entry.expiry > now) {
        return entry.data;
      }
    }

    // Step 1: Attempt to match against official live/archive match scorecard by team tokens
    if (cleanTitle) {
      try {
        const scorecardUrl = await this.findScorecardUrlByTitle(cleanTitle);
        if (scorecardUrl) {
          const html = await this.fetchUrl<string>(scorecardUrl, false, 8000);
          const parsed = this.parseDetailedScorecardHtml(html, cleanTitle);
          if (parsed && parsed.innings.length > 0) {
            scorecardCache.set(cacheKey, {
              expiry: now + SCORECARD_CACHE_TTL_MS,
              data: parsed,
            });
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`[CricketService] Official scorecard scrape error for "${cleanTitle}":`, err);
      }
    }

    // Step 2: Try CricAPI match_scorecard if key is active
    const apiKey = this.getApiKey();
    if (apiKey && matchId && !matchId.startsWith('fallback-')) {
      try {
        const scRes = await this.fetchUrl<any>(
          `${this.BASE_URL}/match_scorecard?apikey=${apiKey}&id=${matchId}`,
          true
        );
        if (scRes?.status === 'success' && scRes.data?.scorecard?.length > 0) {
          const parsed = this.parseCricApiScorecard(scRes.data, cleanTitle);
          scorecardCache.set(cacheKey, {
            expiry: now + SCORECARD_CACHE_TTL_MS,
            data: parsed,
          });
          return parsed;
        }
      } catch (err) {
        // continue to match_info
      }
    }

    // Step 3: If upcoming fixture
    const fallback: DetailedScorecardResult = {
      success: true,
      provider: 'CricketData.org (CricAPI)',
      matchTitle: cleanTitle || 'Cricket Match',
      status: 'Upcoming Fixture',
      innings: [],
      isFallback: true,
    };
    return fallback;
  }

  /**
   * Find Cricbuzz match scorecard URL by searching match index with team tokens
   */
  private static async findScorecardUrlByTitle(title: string): Promise<string | null> {
    const now = Date.now();
    if (!cricbuzzMatchIndex || now - cricbuzzIndexExpiry > 10 * 60 * 1000) {
      const urls = new Map<string, string>();
      try {
        const [liveHtml, seriesHtml] = await Promise.allSettled([
          this.fetchUrl<string>('https://www.cricbuzz.com/cricket-match/live-scores', false, 8000),
          this.fetchUrl<string>('https://www.cricbuzz.com/cricket-series/matches', false, 8000),
        ]);

        const regex = /\/live-cricket-scores\/(\d+)\/([a-z0-9-]+)/g;
        if (liveHtml.status === 'fulfilled') {
          let m: RegExpExecArray | null;
          while ((m = regex.exec(liveHtml.value)) !== null) {
            urls.set(m[1], m[2]);
          }
        }
        if (seriesHtml.status === 'fulfilled') {
          let m: RegExpExecArray | null;
          while ((m = regex.exec(seriesHtml.value)) !== null) {
            urls.set(m[1], m[2]);
          }
        }
      } catch (err) {
        console.warn('[CricketService] Error fetching scorecard index:', err);
      }
      cricbuzzMatchIndex = urls;
      cricbuzzIndexExpiry = now;
    }

    const vsParts = title.split(/\s+(?:vs|v)\s+/i);
    if (vsParts.length < 2) return null;

    const t1Tokens = this.getTeamTokens(vsParts[0] || '');
    const t2Tokens = this.getTeamTokens(vsParts[1] || '');
    const isWomen = /women/i.test(title);

    for (const [id, slug] of cricbuzzMatchIndex.entries()) {
      const slugLower = slug.toLowerCase();
      const slugIsWomen =
        slugLower.includes('women') ||
        slugLower.includes('indw') ||
        slugLower.includes('slw') ||
        slugLower.includes('wcpl');

      if (isWomen !== slugIsWomen) continue;

      const hasT1 = t1Tokens.some((tok) => slugLower.includes(tok));
      const hasT2 = t2Tokens.some((tok) => slugLower.includes(tok));

      if (hasT1 && hasT2) {
        return `https://www.cricbuzz.com/live-cricket-scorecard/${id}/${slug}`;
      }
    }

    return null;
  }

  /**
   * Extract comprehensive matching tokens for any team name
   */
  private static getTeamTokens(name: string): string[] {
    const clean = name.toLowerCase().replace(/women/g, '').trim();
    const tokens: string[] = [];
    const words = clean.split(/\s+/);

    tokens.push(clean.replace(/[^a-z]/g, ''));

    words.forEach((w) => {
      const cw = w.replace(/[^a-z]/g, '');
      if (cw.length >= 3) {
        tokens.push(cw);
        tokens.push(cw.slice(0, 3));
      }
    });

    if (words.length >= 2) {
      tokens.push(words.map((w) => w[0]).join(''));
    }

    if (clean.includes('barbados')) tokens.push('bbt', 'bar', 'bdos');
    if (clean.includes('guyana')) tokens.push('gaw', 'guy');
    if (clean.includes('trinbago')) tokens.push('tkr');
    if (clean.includes('jamaica')) tokens.push('jam', 'jt');
    if (clean.includes('patriots') || clean.includes('kitts')) tokens.push('snp');
    if (clean.includes('lucia')) tokens.push('slk');
    if (clean.includes('sri lanka')) tokens.push('sl', 'slw', 'srl');
    if (clean.includes('india')) tokens.push('ind', 'indw');
    if (clean.includes('pakistan')) tokens.push('pak');
    if (clean.includes('england')) tokens.push('eng');
    if (clean.includes('australia')) tokens.push('aus');
    if (clean.includes('south africa')) tokens.push('sa', 'rsa');
    if (clean.includes('afghanistan')) tokens.push('afg');
    if (clean.includes('namibia')) tokens.push('nam');

    return Array.from(new Set(tokens.filter(Boolean)));
  }

  /**
   * Parse detailed HTML scorecard from Cricbuzz into structured DetailedScorecardResult
   */
  private static parseDetailedScorecardHtml(
    html: string,
    defaultTitle: string
  ): DetailedScorecardResult | null {
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const matchTitle = titleMatch ? titleMatch[1].replace(/scorecard/gi, '').trim() : defaultTitle;

    const statusMatch =
      html.match(/<div class="text-cbComplete[^"]*">([^<]+)<\/div>/i) ||
      html.match(/<div class="text-cbLive[^"]*">([^<]+)<\/div>/i);
    const status = statusMatch ? statusMatch[1].trim() : 'Match Concluded';

    // 1. Try matching <div id="team-\d+-innings-(\d+)"
    const innHeaderRegex = /<div id="team-\d+-innings-(\d+)"[^>]*>([\s\S]*?)<\/div><\/div><\/div>/g;
    const innHeaders: { inningsNum: number; rawHeader: string; headerIndex: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = innHeaderRegex.exec(html)) !== null) {
      innHeaders.push({
        inningsNum: parseInt(m[1], 10),
        rawHeader: m[2],
        headerIndex: m.index,
      });
    }

    const scardRegex = /<div id="scard-team-\d+-innings-(\d+)"[^>]*>/g;
    const scardBlocks: { inningsNum: number; startIndex: number }[] = [];
    let scM: RegExpExecArray | null;
    while ((scM = scardRegex.exec(html)) !== null) {
      scardBlocks.push({
        inningsNum: parseInt(scM[1], 10),
        startIndex: scM.index,
      });
    }

    const innings: ScorecardInnings[] = [];

    if (innHeaders.length > 0) {
      for (let i = 0; i < innHeaders.length; i++) {
        const hdr = innHeaders[i];
        const teamNameMatch =
          hdr.rawHeader.match(/<div class="hidden tb:block font-bold">([^<]+)<\/div>/i) ||
          hdr.rawHeader.match(/<div class="[^"]*font-bold[^"]*">([^<]+)<\/div>/i);
        const teamName = teamNameMatch ? teamNameMatch[1].trim() : `Team ${i + 1}`;

        const scoreMatch = hdr.rawHeader.match(/(\d+)-(\d+)/);
        const runs = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
        const wickets = scoreMatch ? parseInt(scoreMatch[2], 10) : 0;

        const oversMatch = hdr.rawHeader.match(/\(([\d.]+)\s*Ov/i);
        const overs = oversMatch ? parseFloat(oversMatch[1]) : 0;
        const runRate = overs > 0 ? Number((runs / overs).toFixed(2)) : 0;

        const scard = scardBlocks.find((b) => b.inningsNum === hdr.inningsNum) || scardBlocks[i];
        let chunk = '';
        if (scard) {
          const nextScard =
            scardBlocks.find((b) => b.inningsNum === hdr.inningsNum + 1) || scardBlocks[i + 1];
          const endIdx = nextScard
            ? nextScard.startIndex
            : html.indexOf('scorecard-match-info', scard.startIndex);
          chunk = html.substring(scard.startIndex, endIdx !== -1 ? endIdx : scard.startIndex + 80000);
        }

        const batters: ScorecardBatsman[] = [];
        const batRowRegex =
          /<span class="hover:underline">([^<]+)<\/span>[\s\S]*?<div class="[^"]*text-cbTxtSec[^"]*">([^<]*)<\/div>[\s\S]*?<div class="[^"]*font-bold[^"]*">(\d+)<\/div>[\s\S]*?<div class="flex justify-center items-center">(\d+)<\/div>[\s\S]*?<div class="flex justify-center items-center">(\d+)<\/div>[\s\S]*?<div class="flex justify-center items-center">(\d+)<\/div>[\s\S]*?<div class="flex justify-center items-center">([\d.]+)<\/div>/g;

        let bMatch: RegExpExecArray | null;
        let bIdx = 1;
        while ((bMatch = batRowRegex.exec(chunk)) !== null) {
          const bName = bMatch[1].trim();
          const outDesc = bMatch[2].trim() || 'not out';
          batters.push({
            id: bIdx++,
            name: bName,
            isCaptain: bName.includes('(c)'),
            isKeeper: bName.includes('(wk)'),
            runs: parseInt(bMatch[3], 10),
            balls: parseInt(bMatch[4], 10),
            fours: parseInt(bMatch[5], 10),
            sixes: parseInt(bMatch[6], 10),
            strikeRate: parseFloat(bMatch[7]),
            outDesc,
            isNotOut: outDesc.toLowerCase().includes('not out') || outDesc === '',
          });
        }

        const bowlers: ScorecardBowler[] = [];
        const bowlChunkIdx = chunk.indexOf('scorecard-bowl-grid');
        if (bowlChunkIdx !== -1) {
          const bowlChunk = chunk.substring(bowlChunkIdx);
          const bowlRowRegex =
            /<span class="hover:underline">([^<]+)<\/span>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">([\d.]+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">([\d.]+)<\/div>/g;

          let bwMatch: RegExpExecArray | null;
          let bwIdx = 1;
          while ((bwMatch = bowlRowRegex.exec(bowlChunk)) !== null) {
            bowlers.push({
              id: bwIdx++,
              name: bwMatch[1].trim(),
              overs: bwMatch[2],
              maidens: parseInt(bwMatch[3], 10),
              runs: parseInt(bwMatch[4], 10),
              wickets: parseInt(bwMatch[5], 10),
              noBalls: parseInt(bwMatch[6], 10),
              wides: parseInt(bwMatch[7], 10),
              economy: parseFloat(bwMatch[8]),
            });
          }
        }

        innings.push({
          inningsId: hdr.inningsNum,
          teamName,
          teamShortName: teamName.slice(0, 4).toUpperCase(),
          runs: runs || batters.reduce((s, b) => s + b.runs, 0),
          wickets: wickets || batters.filter((b) => !b.isNotOut).length,
          overs:
            overs ||
            (bowlers.length > 0
              ? Math.max(...bowlers.map((b) => parseFloat(String(b.overs))))
              : 20),
          runRate,
          batsmen: batters,
          bowlers,
        });
      }
    } else {
      // 2. Fallback to hidden tb:block font-bold header
      const innRegex = /<div class="hidden tb:block font-bold">([A-Za-z0-9\s]+Innings)<\/div>/g;
      const innMatches: { title: string; index: number }[] = [];
      let innM: RegExpExecArray | null;
      while ((innM = innRegex.exec(html)) !== null) {
        innMatches.push({ title: innM[1].trim(), index: innM.index });
      }

      for (let i = 0; i < innMatches.length; i++) {
        const startIdx = innMatches[i].index;
        const endIdx =
          i + 1 < innMatches.length
            ? innMatches[i + 1].index
            : html.indexOf('scorecard-match-info', startIdx);
        const chunk = html.substring(startIdx, endIdx !== -1 ? endIdx : startIdx + 80000);

        const teamInningName = innMatches[i].title;
        const teamCleanName = teamInningName.replace(/\s*(?:1st|2nd)?\s*Innings/gi, '').trim();

        const scoreMatch = chunk.match(/(\d+)-(\d+)\s*\(([\d.]+)\s*Ov/i);
        const runs = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
        const wickets = scoreMatch ? parseInt(scoreMatch[2], 10) : 0;
        const overs = scoreMatch ? parseFloat(scoreMatch[3]) : 0;
        const runRate = overs > 0 ? Number((runs / overs).toFixed(2)) : 0;

        const batters: ScorecardBatsman[] = [];
        const batRowRegex =
          /<span class="hover:underline">([^<]+)<\/span>[\s\S]*?<div class="[^"]*text-cbTxtSec[^"]*">([^<]*)<\/div>[\s\S]*?<div class="[^"]*font-bold[^"]*">(\d+)<\/div>[\s\S]*?<div class="flex justify-center items-center">(\d+)<\/div>[\s\S]*?<div class="flex justify-center items-center">(\d+)<\/div>[\s\S]*?<div class="flex justify-center items-center">(\d+)<\/div>[\s\S]*?<div class="flex justify-center items-center">([\d.]+)<\/div>/g;

        let bMatch: RegExpExecArray | null;
        let bIdx = 1;
        while ((bMatch = batRowRegex.exec(chunk)) !== null) {
          const bName = bMatch[1].trim();
          const outDesc = bMatch[2].trim() || 'not out';
          batters.push({
            id: bIdx++,
            name: bName,
            isCaptain: bName.includes('(c)'),
            isKeeper: bName.includes('(wk)'),
            runs: parseInt(bMatch[3], 10),
            balls: parseInt(bMatch[4], 10),
            fours: parseInt(bMatch[5], 10),
            sixes: parseInt(bMatch[6], 10),
            strikeRate: parseFloat(bMatch[7]),
            outDesc,
            isNotOut: outDesc.toLowerCase().includes('not out') || outDesc === '',
          });
        }

        const bowlers: ScorecardBowler[] = [];
        const bowlChunkIdx = chunk.indexOf('scorecard-bowl-grid');
        if (bowlChunkIdx !== -1) {
          const bowlChunk = chunk.substring(bowlChunkIdx);
          const bowlRowRegex =
            /<span class="hover:underline">([^<]+)<\/span>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">([\d.]+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">(\d+)<\/div>[\s\S]*?<div class="[^"]*flex justify-center[^"]*">([\d.]+)<\/div>/g;

          let bwMatch: RegExpExecArray | null;
          let bwIdx = 1;
          while ((bwMatch = bowlRowRegex.exec(bowlChunk)) !== null) {
            bowlers.push({
              id: bwIdx++,
              name: bwMatch[1].trim(),
              overs: bwMatch[2],
              maidens: parseInt(bwMatch[3], 10),
              runs: parseInt(bwMatch[4], 10),
              wickets: parseInt(bwMatch[5], 10),
              noBalls: parseInt(bwMatch[6], 10),
              wides: parseInt(bwMatch[7], 10),
              economy: parseFloat(bwMatch[8]),
            });
          }
        }

        innings.push({
          inningsId: i + 1,
          teamName: teamCleanName,
          teamShortName: teamCleanName.slice(0, 4).toUpperCase(),
          runs: runs || batters.reduce((s, b) => s + b.runs, 0),
          wickets: wickets || batters.filter((b) => !b.isNotOut).length,
          overs:
            overs ||
            (bowlers.length > 0
              ? Math.max(...bowlers.map((b) => parseFloat(String(b.overs))))
              : 20),
          runRate,
          batsmen: batters,
          bowlers,
        });
      }
    }

    if (innings.length === 0) return null;

    return {
      success: true,
      provider: 'Cricket Live Data Service',
      matchTitle,
      status,
      innings,
      isFallback: false,
    };
  }

  /**
   * Parse CricAPI match_scorecard endpoint
   */
  private static parseCricApiScorecard(data: any, defaultTitle: string): DetailedScorecardResult {
    const matchTitle = data.name || defaultTitle;
    const status = data.status || 'Match Concluded';
    const venue = data.venue || '';
    const dateTimeGMT = data.dateTimeGMT || '';
    const matchType = data.matchType || '';
    const toss = data.tossWinner
      ? `${data.tossWinner} chose to ${data.tossChoice || 'bat'}`
      : undefined;

    const innings: ScorecardInnings[] = [];

    if (Array.isArray(data.scorecard)) {
      data.scorecard.forEach((inn: any, idx: number) => {
        const teamName = inn.inning ? inn.inning.replace(/inning\s*\d*/gi, '').trim() : `Innings ${idx + 1}`;

        const batsmen: ScorecardBatsman[] = (inn.batting || []).map((b: any, bIdx: number) => ({
          id: b.batsman?.id || bIdx,
          name: b.batsman?.name || 'Batsman',
          runs: Number(b.r ?? 0),
          balls: Number(b.b ?? 0),
          fours: Number(b['4s'] ?? b.fours ?? 0),
          sixes: Number(b['6s'] ?? b.sixes ?? 0),
          strikeRate: Number(b.sr ?? 0),
          outDesc: b.dismissal || 'not out',
          isNotOut: !b.dismissal || b.dismissal.toLowerCase().includes('not out'),
        }));

        const bowlers: ScorecardBowler[] = (inn.bowling || []).map((bw: any, bwIdx: number) => ({
          id: bw.bowler?.id || bwIdx,
          name: bw.bowler?.name || 'Bowler',
          overs: bw.o ?? 0,
          maidens: Number(bw.m ?? 0),
          runs: Number(bw.r ?? 0),
          wickets: Number(bw.w ?? 0),
          economy: Number(bw.eco ?? 0),
          wides: Number(bw.wides ?? 0),
          noBalls: Number(bw.noBalls ?? 0),
        }));

        const runs = Number(inn.totals?.R ?? batsmen.reduce((sum, b) => sum + b.runs, 0));
        const wickets = Number(inn.totals?.W ?? batsmen.filter((b) => !b.isNotOut).length);
        const overs = Number(inn.totals?.O ?? (bowlers.length > 0 ? Math.max(...bowlers.map((bw) => Number(bw.overs))) : 20));
        const runRate = Number(inn.totals?.RR ?? (overs > 0 ? Number((runs / overs).toFixed(2)) : 0));

        innings.push({
          inningsId: idx + 1,
          teamName,
          teamShortName: teamName.slice(0, 4).toUpperCase(),
          runs,
          wickets,
          overs,
          runRate,
          batsmen,
          bowlers,
        });
      });
    }

    return {
      success: true,
      provider: 'CricketData.org (CricAPI)',
      matchTitle,
      status,
      venue,
      dateTimeGMT,
      matchType,
      toss,
      innings,
      isFallback: false,
    };
  }

  /**
   * Fallback live index if CricAPI quota limit is reached
   */
  private static async fetchLiveMatchesFromIndex(): Promise<CricketMatch[]> {
    const list: CricketMatch[] = [];
    try {
      const html = await this.fetchUrl<string>('https://www.cricbuzz.com/cricket-match/live-scores', false, 8000);
      const regex = /\/live-cricket-scores\/(\d+)\/([a-z0-9-]+)/g;
      let m: RegExpExecArray | null;
      const seen = new Set<string>();

      while ((m = regex.exec(html)) !== null) {
        const id = m[1];
        const slug = m[2];
        if (seen.has(id)) continue;
        seen.add(id);

        const slugParts = slug.split('-vs-');
        if (slugParts.length < 2) continue;

        const t1Raw = slugParts[0].replace(/-/g, ' ').toUpperCase();
        const rest = slugParts[1].split('-');
        const t2Raw = rest[0].toUpperCase();
        const tournament = rest.slice(1).join(' ');

        list.push({
          id,
          title: `${t1Raw} vs ${t2Raw}${tournament ? `, ${tournament.toUpperCase()}` : ''}`,
          status: 'LIVE',
          statusText: 'Live Match in Progress',
          dateTimeGMT: new Date().toISOString(),
          team1: {
            name: t1Raw,
            shortName: t1Raw.slice(0, 4),
            score: '',
            isBatting: false,
          },
          team2: {
            name: t2Raw,
            shortName: t2Raw.slice(0, 4),
            score: '',
            isBatting: false,
          },
        });
      }
    } catch (err) {
      console.warn('[CricketService] Error in live index fallback:', err);
    }
    return list;
  }

  /**
   * Map currentMatches and matches endpoint items
   */
  private static mapCurrentOrScheduleMatch(raw: any): CricketMatch {
    const id = raw.id || `cricapi-${Math.random().toString(36).substring(2, 9)}`;
    const title = raw.name || `${raw.teams?.[0] || 'Team 1'} vs ${raw.teams?.[1] || 'Team 2'}`;
    const venue = raw.venue || '';
    const dateTimeGMT = raw.dateTimeGMT || raw.date || new Date().toISOString();
    const matchType = (raw.matchType || 't20').toLowerCase();

    let status: 'LIVE' | 'COMPLETED' | 'UPCOMING' = 'UPCOMING';
    if (raw.matchEnded) {
      status = 'COMPLETED';
    } else if (raw.matchStarted) {
      status = 'LIVE';
    }

    const teamNames: string[] =
      raw.teams || [raw.teamInfo?.[0]?.name || 'Team 1', raw.teamInfo?.[1]?.name || 'Team 2'];
    const team1Name = teamNames[0] || 'Team 1';
    const team2Name = teamNames[1] || 'Team 2';

    const t1Info = raw.teamInfo?.find(
      (t: any) => t.name === team1Name || t.shortname === team1Name
    );
    const t2Info = raw.teamInfo?.find(
      (t: any) => t.name === team2Name || t.shortname === team2Name
    );

    const scores: any[] = Array.isArray(raw.score) ? raw.score : [];
    let t1Score = '';
    let t1Overs = '';
    let t2Score = '';
    let t2Overs = '';
    let t1Batting = false;
    let t2Batting = false;

    scores.forEach((sc) => {
      const inningStr = (sc.inning || '').toLowerCase();
      const isTeam1 =
        inningStr.includes(team1Name.toLowerCase()) ||
        (t1Info?.shortname && inningStr.includes(t1Info.shortname.toLowerCase()));
      const runsWickets = `${sc.r}/${sc.w}`;
      const ovs = `${sc.o} ov`;

      if (isTeam1) {
        t1Score = runsWickets;
        t1Overs = ovs;
      } else {
        t2Score = runsWickets;
        t2Overs = ovs;
      }
    });

    if (status === 'LIVE') {
      if (scores.length === 1) {
        t1Batting = true;
      } else if (scores.length >= 2) {
        t2Batting = true;
      }
    }

    const statusText =
      raw.status ||
      (status === 'UPCOMING'
        ? `Starts ${dateTimeGMT.replace('T', ' ')} GMT`
        : 'Match in progress');

    return {
      id,
      title,
      matchType,
      status,
      statusText,
      venue,
      dateTimeGMT,
      hasScorecard: status !== 'UPCOMING',
      team1: {
        name: team1Name,
        shortName: t1Info?.shortname || this.getAbbr(team1Name),
        img: t1Info?.img,
        score: t1Score ? `${t1Score}${t1Overs ? ` (${t1Overs})` : ''}` : '',
        overs: t1Overs,
        isBatting: t1Batting,
      },
      team2: {
        name: team2Name,
        shortName: t2Info?.shortname || this.getAbbr(team2Name),
        img: t2Info?.img,
        score: t2Score ? `${t2Score}${t2Overs ? ` (${t2Overs})` : ''}` : '',
        overs: t2Overs,
        isBatting: t2Batting,
      },
    };
  }

  /**
   * Map cricScore item
   */
  private static mapCricScoreItem(item: any): CricketMatch {
    const id = item.id || `cricscore-${Math.random().toString(36).substring(2, 9)}`;
    const matchType = (item.matchType || 't20').toLowerCase();
    const dateTimeGMT = item.dateTimeGMT || new Date().toISOString();

    let status: 'LIVE' | 'COMPLETED' | 'UPCOMING' = 'UPCOMING';
    if (item.ms === 'live') {
      status = 'LIVE';
    } else if (item.ms === 'result') {
      status = 'COMPLETED';
    } else if (item.ms === 'fixture') {
      status = 'UPCOMING';
    }

    const parseTeamWithBracket = (str: string) => {
      const match = str.match(/^(.*?)(?:\s*\[(.*?)\])?$/);
      if (match) {
        const name = (match[1] || str).trim();
        const abbr = match[2] ? match[2].trim() : '';
        return { name, abbr };
      }
      return { name: str.trim(), abbr: '' };
    };

    const t1Parsed = parseTeamWithBracket(item.t1 || 'Team 1');
    const t2Parsed = parseTeamWithBracket(item.t2 || 'Team 2');

    const title = `${t1Parsed.name} vs ${t2Parsed.name}${
      item.series ? `, ${item.series}` : ''
    }`;
    const statusText =
      item.status ||
      (status === 'UPCOMING'
        ? `Starts ${dateTimeGMT.replace('T', ' ')} GMT`
        : 'Match in progress');

    const t1Batting = (item.t1s || '').includes('*');
    const t2Batting = (item.t2s || '').includes('*');

    return {
      id,
      title,
      matchType,
      status,
      statusText,
      dateTimeGMT,
      hasScorecard: status !== 'UPCOMING',
      team1: {
        name: t1Parsed.name,
        shortName: t1Parsed.abbr || this.getAbbr(t1Parsed.name),
        img: item.t1img,
        score: item.t1s || (status === 'UPCOMING' ? 'Scheduled' : ''),
        isBatting: t1Batting,
      },
      team2: {
        name: t2Parsed.name,
        shortName: t2Parsed.abbr || this.getAbbr(t2Parsed.name),
        img: item.t2img,
        score: item.t2s || (status === 'UPCOMING' ? 'Scheduled' : ''),
        isBatting: t2Batting,
      },
    };
  }

  private static getAbbr(name: string): string {
    const clean = name.replace(/women/gi, '').trim();
    const isW = /women/i.test(name);
    const parts = clean.split(/\s+/);
    let abbr =
      parts.length >= 2
        ? parts.map((p) => p[0]).join('').toUpperCase()
        : clean.slice(0, 3).toUpperCase();
    return isW ? `${abbr}-W` : abbr;
  }
}
