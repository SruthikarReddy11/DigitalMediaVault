import http from 'http';
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
const athleteNameCache = new Map<string, string>();

const MATCHES_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const SCORECARD_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes for completed
const SCORECARD_LIVE_CACHE_TTL_MS = 25 * 1000; // 25 seconds for live

// Known ICC National / International Cricket Entities
const KNOWN_INTERNATIONAL_TEAMS = new Set([
  'india', 'australia', 'england', 'pakistan', 'south africa', 'new zealand',
  'sri lanka', 'west indies', 'bangladesh', 'afghanistan', 'zimbabwe', 'ireland',
  'scotland', 'netherlands', 'namibia', 'nepal', 'oman', 'united arab emirates',
  'uae', 'usa', 'united states of america', 'canada', 'papua new guinea', 'png',
  'uganda', 'kenya', 'hong kong', 'italy', 'jersey', 'kuwait', 'bahrain',
  'singapore', 'malaysia', 'japan', 'china', 'thailand', 'rwanda', 'botswana',
  'sierra leone', 'tanzania', 'nigeria', 'ghana', 'malawi', 'mozambique',
  'bermuda', 'cayman islands', 'argentina', 'brazil', 'fiji', 'vanuatu',
  'samoa', 'germany', 'spain', 'denmark', 'norway', 'sweden', 'finland',
  'austria', 'france', 'belgium', 'luxembourg', 'cyprus', 'gibraltar', 'portugal',
  'switzerland', 'guernsey', 'isle of man', 'czech republic', 'bulgaria', 'romania',
  'serbia', 'greece', 'turkey', 'croatia', 'slovenia', 'malta', 'hungary',
  'estonia', 'qatar', 'saudi arabia', 'maldives', 'bhutan', 'indonesia', 'philippines',
  'myanmar', 'cambodia', 'mongolia', 'cook islands'
]);

// Words that indicate domestic cricket rather than international
const DOMESTIC_KEYWORDS = [
  'county championship', 'one-day cup', 'vitality blast', 'sheffield shield',
  'marsh cup', 'ranji trophy', 'vijay hazare', 'syed mushtaq ali', 'duleep trophy',
  'plunket shield', 'ford trophy', 'super smash', 'csa 4-day', 'csa t20 challenge',
  'first-class matches', 'second xi', 'academy', 'provincial', 'trophy division'
];

export class CricketService {
  private static CORE_BASE_URL =
    process.env.ESPN_CRICINFO_CORE_URL || 'http://core.espnuk.org/v2/sports/cricket';
  private static RSS_LIVESCORS_URL =
    process.env.ESPN_CRICINFO_RSS_URL || 'https://static.cricinfo.com/rss/livescores.xml';

  /**
   * Generic HTTP/HTTPS JSON fetcher with User-Agent & timeout
   */
  private static fetchJson<T = any>(url: string, timeoutMs = 8000): Promise<T | null> {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
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
              resolve(JSON.parse(data) as T);
            } catch {
              resolve(null);
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.on('error', () => {
        resolve(null);
      });
    });
  }

  /**
   * Fetch text or XML from URL
   */
  private static fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/xml, text/xml, */*',
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
            resolve(data);
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.on('error', () => {
        resolve(null);
      });
    });
  }

  /**
   * Formats Date to YYYYMMDD string for ESPN Core API
   */
  private static formatDateParam(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  /**
   * Evaluates whether an ESPN match is genuinely an International match
   */
  public static isInternationalMatch(
    eventName: string,
    cls?: any,
    competitors?: any[]
  ): boolean {
    const lowerName = (eventName || '').toLowerCase();

    // Reject any match with domestic keywords in name or class name
    const className = (cls?.name || '').toLowerCase();
    if (DOMESTIC_KEYWORDS.some((kw) => lowerName.includes(kw) || className.includes(kw))) {
      return false;
    }

    // Check internationalClassId: in ESPN Cricinfo, 0 = domestic, > 0 = international (Test, ODI, T20I, Women, Youth)
    const intClassId = cls?.internationalClassId;
    if (intClassId && intClassId !== '0') {
      return true;
    }

    // Secondary check: verify teams against known ICC national teams
    const vsParts = lowerName.split(/\s+(?:v|vs)\s+/i);
    if (vsParts.length >= 2) {
      const t1Clean = vsParts[0].replace(/(?:women|under-19s|u19|'a'|\(c\)|\(wk\))/g, '').trim();
      const t2Clean = vsParts[1].replace(/(?:women|under-19s|u19|'a'|\(c\)|\(wk\))/g, '').trim();

      const t1IsInt = Array.from(KNOWN_INTERNATIONAL_TEAMS).some((t) => t1Clean.includes(t));
      const t2IsInt = Array.from(KNOWN_INTERNATIONAL_TEAMS).some((t) => t2Clean.includes(t));

      if (t1IsInt && t2IsInt) return true;
    }

    // Competitor country flag check
    if (Array.isArray(competitors) && competitors.length >= 2) {
      const c1 = competitors[0]?.team;
      const c2 = competitors[1]?.team;
      if (c1?.isCountry || c1?.isNational || c2?.isCountry || c2?.isNational) {
        return true;
      }
    }

    return false;
  }

  /**
   * Fetches all international matches (Live, Upcoming, and Completed)
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
      try {
        matches = await this.aggregateInternationalMatches();
        if (matches.length > 0) {
          cachedMatchesList = {
            expiry: now + MATCHES_CACHE_TTL_MS,
            data: matches,
          };
        }
      } catch (err) {
        console.warn('[CricketService] Error aggregating ESPN international matches:', err);
        if (cachedMatchesList) {
          matches = cachedMatchesList.data;
          isCached = true;
        }
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
      provider: 'ESPN Cricinfo International',
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
   * Aggregates international matches across past, present, and future dates
   */
  private static async aggregateInternationalMatches(): Promise<CricketMatch[]> {
    const matchesMap = new Map<string, CricketMatch>();

    // 1. Fetch live scores from ESPN Cricinfo RSS feed (Fastest real-time updates)
    try {
      const rssText = await this.fetchText(this.RSS_LIVESCORS_URL, 5000);
      if (rssText) {
        const rssMatches = this.parseRssLiveScores(rssText);
        rssMatches.forEach((m) => matchesMap.set(m.id, m));
      }
    } catch (rssErr) {
      console.warn('[CricketService] RSS live feed warning:', rssErr);
    }

    // 2. Query dates from -2 days to +4 days (Today, Recent Results, and Upcoming Fixtures)
    const dates: string[] = [];
    const baseDate = new Date();
    for (let offset = -2; offset <= 4; offset++) {
      const d = new Date(baseDate.getTime() + offset * 24 * 60 * 60 * 1000);
      dates.push(this.formatDateParam(d));
    }

    // Query date listings in parallel
    const dateResponses = await Promise.all(
      dates.map((dt) =>
        this.fetchJson<any>(`${this.CORE_BASE_URL}/events?dates=${dt}`, 6000)
      )
    );

    const eventRefs = new Set<string>();
    dateResponses.forEach((res) => {
      res?.items?.forEach((it: any) => {
        if (it?.$ref) eventRefs.add(it.$ref);
      });
    });

    // Ingest event details in concurrent batches
    const refArray = Array.from(eventRefs);
    const BATCH_SIZE = 12;

    for (let i = 0; i < refArray.length; i += BATCH_SIZE) {
      const chunk = refArray.slice(i, i + BATCH_SIZE);
      const eventDetails = await Promise.all(
        chunk.map(async (ref) => {
          try {
            const ev = await this.fetchJson<any>(ref, 6000);
            if (!ev || !ev.id) return null;

            const comp = ev.competitions?.[0];
            const compData = comp?.$ref
              ? await this.fetchJson<any>(comp.$ref, 6000)
              : comp;
            if (!compData) return null;

            // Strict International Filter
            const cls = compData.class || {};
            const isInt = this.isInternationalMatch(ev.name, cls, compData.competitors);
            if (!isInt) return null;

            return await this.mapEspnEventToMatch(ev, compData);
          } catch {
            return null;
          }
        })
      );

      eventDetails.filter(Boolean).forEach((m) => {
        if (m) {
          // If already in map from RSS live feed with real-time score, merge
          if (matchesMap.has(m.id)) {
            const existing = matchesMap.get(m.id)!;
            existing.venue = existing.venue || m.venue;
            existing.dateTimeGMT = m.dateTimeGMT;
            if (!existing.team1.score && m.team1.score) existing.team1.score = m.team1.score;
            if (!existing.team2.score && m.team2.score) existing.team2.score = m.team2.score;
          } else {
            matchesMap.set(m.id, m);
          }
        }
      });
    }

    // Sort: LIVE first, then UPCOMING by earliest date, then COMPLETED by latest date
    const list = Array.from(matchesMap.values());
    list.sort((a, b) => {
      if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
      if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;

      if (a.status === 'UPCOMING' && b.status === 'UPCOMING') {
        return (
          new Date(a.dateTimeGMT || 0).getTime() -
          new Date(b.dateTimeGMT || 0).getTime()
        );
      }

      return (
        new Date(b.dateTimeGMT || 0).getTime() -
        new Date(a.dateTimeGMT || 0).getTime()
      );
    });

    return list;
  }

  /**
   * Maps an ESPN Core API event & competition to a structured CricketMatch
   */
  private static async mapEspnEventToMatch(ev: any, comp: any): Promise<CricketMatch> {
    const id = String(ev.id);
    const title = ev.name || 'International Match';
    const venue = comp.venue?.fullName || comp.venue?.address?.city || '';
    const dateTimeGMT = comp.date || ev.date || new Date().toISOString();

    const cls = comp.class || {};
    const rawType = (cls.generalClassCard || cls.eventType || 't20').toLowerCase();
    const matchType = rawType.includes('test')
      ? 'test'
      : rawType.includes('odi')
      ? 'odi'
      : 't20';

    // Status classification: resolve status $ref if present
    const statusData = comp.status?.$ref
      ? await this.fetchJson<any>(comp.status.$ref, 4000)
      : comp.status;

    const statusType = statusData?.type || {};
    const state = (statusType.state || '').toLowerCase();
    const desc = (statusType.description || statusType.detail || '').toLowerCase();

    const matchDateMs = new Date(dateTimeGMT).getTime();
    const isPast = matchDateMs < Date.now() - 6 * 60 * 60 * 1000;

    let status: 'LIVE' | 'COMPLETED' | 'UPCOMING' = 'UPCOMING';
    if (state === 'in' || desc.includes('live') || desc.includes('progress') || desc.includes('tea') || desc.includes('lunch') || desc.includes('stumps')) {
      status = 'LIVE';
    } else if (state === 'post' || desc.includes('result') || desc.includes('final') || desc.includes('won by') || desc.includes('abandoned') || desc.includes('draw') || isPast) {
      status = 'COMPLETED';
    } else {
      status = 'UPCOMING';
    }

    const statusText =
      statusData?.longSummary ||
      statusData?.summary ||
      statusType.detail ||
      statusType.shortDetail ||
      statusType.description ||
      (status === 'UPCOMING'
        ? `Starts ${dateTimeGMT.replace('T', ' ').slice(0, 16)} GMT`
        : 'Match concluded');

    // Extract Competitors & resolve score $ref if present
    const competitors = comp.competitors || [];
    const c1 = competitors[0] || {};
    const c2 = competitors[1] || {};

    const [team1Data, team2Data, score1Data, score2Data] = await Promise.all([
      c1.team?.$ref ? this.fetchJson<any>(c1.team.$ref, 4000) : c1.team,
      c2.team?.$ref ? this.fetchJson<any>(c2.team.$ref, 4000) : c2.team,
      c1.score?.$ref ? this.fetchJson<any>(c1.score.$ref, 4000) : c1.score,
      c2.score?.$ref ? this.fetchJson<any>(c2.score.$ref, 4000) : c2.score,
    ]);

    const t1Name = team1Data?.name || this.extractTeamFromTitle(title, 0);
    const t2Name = team2Data?.name || this.extractTeamFromTitle(title, 1);

    const t1ScoreRaw = score1Data?.displayValue || score1Data?.value || '';
    const t2ScoreRaw = score2Data?.displayValue || score2Data?.value || '';

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
        name: t1Name,
        shortName: team1Data?.abbreviation || this.getAbbr(t1Name),
        score: t1ScoreRaw,
        isBatting: false,
      },
      team2: {
        name: t2Name,
        shortName: team2Data?.abbreviation || this.getAbbr(t2Name),
        score: t2ScoreRaw,
        isBatting: false,
      },
    };
  }

  /**
   * Parse real-time live matches from ESPN Cricinfo RSS feed
   */
  private static parseRssLiveScores(xml: string): CricketMatch[] {
    const list: CricketMatch[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];

      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const rawTitle = titleMatch ? titleMatch[1].trim() : '';

      const guidMatch = itemContent.match(/<guid>[\s\S]*?(\d+)\.html<\/guid>/);
      const id = guidMatch ? guidMatch[1] : `espn-rss-${Math.random().toString(36).substring(2, 9)}`;

      if (!rawTitle) continue;

      // Filter: only international matches
      if (!this.isInternationalMatch(rawTitle)) continue;

      const vsParts = rawTitle.split(/\s+(?:v|vs)\s+/i);
      if (vsParts.length < 2) continue;

      const part1 = vsParts[0].trim();
      const part2 = vsParts[1].trim();

      // Parse score from part e.g. "Malaysia 144/6" or "UAE 150/4 *"
      const t1Parsed = this.extractTeamAndScore(part1);
      const t2Parsed = this.extractTeamAndScore(part2);

      const isLive = part1.includes('*') || part2.includes('*') || (!part1.includes('won') && !part2.includes('won'));

      list.push({
        id,
        title: `${t1Parsed.name} vs ${t2Parsed.name}`,
        matchType: /t20/i.test(rawTitle) ? 't20' : /odi/i.test(rawTitle) ? 'odi' : 'test',
        status: isLive ? 'LIVE' : 'COMPLETED',
        statusText: isLive ? 'Live In Progress' : 'Match Concluded',
        dateTimeGMT: new Date().toISOString(),
        hasScorecard: true,
        team1: {
          name: t1Parsed.name,
          shortName: this.getAbbr(t1Parsed.name),
          score: t1Parsed.score,
          isBatting: t1Parsed.isBatting,
        },
        team2: {
          name: t2Parsed.name,
          shortName: this.getAbbr(t2Parsed.name),
          score: t2Parsed.score,
          isBatting: t2Parsed.isBatting,
        },
      });
    }

    return list;
  }

  /**
   * Helper to extract team name and score from RSS feed string
   */
  private static extractTeamAndScore(str: string): { name: string; score: string; isBatting: boolean } {
    const isBatting = str.includes('*');
    const clean = str.replace(/\*/g, '').trim();

    const scoreMatch = clean.match(/^(.*?)\s+(\d+\/\d+|\d+)(?:\s*\((.*?)\))?$/);
    if (scoreMatch) {
      const name = scoreMatch[1].trim();
      const baseScore = scoreMatch[2];
      const overs = scoreMatch[3] ? ` (${scoreMatch[3]})` : '';
      return {
        name,
        score: `${baseScore}${overs}`,
        isBatting,
      };
    }

    return {
      name: clean,
      score: '',
      isBatting,
    };
  }

  /**
   * Retrieves player display name with caching
   */
  private static async getAthleteName(athleteRef?: string): Promise<string> {
    if (!athleteRef) return 'Player';
    if (athleteNameCache.has(athleteRef)) {
      return athleteNameCache.get(athleteRef)!;
    }

    try {
      const data = await this.fetchJson<any>(athleteRef, 5000);
      const name = data?.displayName || data?.shortName || 'Player';
      athleteNameCache.set(athleteRef, name);
      return name;
    } catch {
      return 'Player';
    }
  }

  /**
   * Detailed Scorecard for any match directly from ESPN Cricinfo:
   * Returns authentic player statistics (runs, balls, 4s, 6s, overs, maidens, wickets, economy)
   */
  public static async getMatchScorecard(
    matchId?: string,
    title?: string
  ): Promise<DetailedScorecardResult> {
    const now = Date.now();
    const cleanTitle = title || '';
    const cleanId = matchId ? matchId.replace(/[^0-9]/g, '') : '';
    const cacheKey = cleanId || cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (cacheKey && scorecardCache.has(cacheKey)) {
      const entry = scorecardCache.get(cacheKey)!;
      if (entry.expiry > now) {
        return entry.data;
      }
    }

    // Step 1: Query ESPN Core API for this event
    if (cleanId) {
      try {
        const ev = await this.fetchJson<any>(`${this.CORE_BASE_URL}/events/${cleanId}`, 8000);
        if (ev && ev.id) {
          const comp = ev.competitions?.[0];
          const compData = comp?.$ref
            ? await this.fetchJson<any>(comp.$ref, 8000)
            : comp;

          if (compData) {
            const scorecard = await this.buildDetailedScorecardFromEspn(ev, compData);
            if (scorecard) {
              const ttl =
                scorecard.status.toLowerCase().includes('live') ||
                scorecard.status.toLowerCase().includes('progress')
                  ? SCORECARD_LIVE_CACHE_TTL_MS
                  : SCORECARD_CACHE_TTL_MS;

              scorecardCache.set(cacheKey, {
                expiry: now + ttl,
                data: scorecard,
              });
              return scorecard;
            }
          }
        }
      } catch (err) {
        console.warn(`[CricketService] Error fetching ESPN scorecard for ID ${cleanId}:`, err);
      }
    }

    // Step 2: Fallback for upcoming fixture or pending scorecard
    const fallback: DetailedScorecardResult = {
      success: true,
      provider: 'ESPN Cricinfo International',
      matchTitle: cleanTitle || 'International Cricket Match',
      status: 'Upcoming International Fixture',
      venue: 'International Stadium',
      innings: [],
      isFallback: true,
    };

    return fallback;
  }

  /**
   * Builds structured DetailedScorecardResult from ESPN Core API event & competition
   */
  private static async buildDetailedScorecardFromEspn(
    ev: any,
    comp: any
  ): Promise<DetailedScorecardResult | null> {
    const matchTitle = ev.name || 'International Match';
    const venue = comp.venue?.fullName || comp.venue?.address?.city || '';
    const dateTimeGMT = comp.date || ev.date || '';

    // Extract toss, series, match result
    let toss: string | undefined;
    let seriesName: string | undefined;
    let result: string | undefined;

    for (const note of comp.notes || []) {
      if (note.type === 'toss') toss = note.text;
      if (note.type === 'seriesnote') seriesName = note.text;
    }

    const statusData = comp.status?.$ref
      ? await this.fetchJson<any>(comp.status.$ref, 5000)
      : comp.status;

    const statusObj = statusData?.type || {};
    const status =
      statusData?.longSummary ||
      statusData?.summary ||
      statusObj.detail ||
      statusObj.description ||
      'Match Concluded';

    const competitors = comp.competitors || [];
    if (competitors.length < 2) return null;

    // Collect competitor data and linescores
    const teamDataList: {
      teamId: string;
      teamName: string;
      teamShortName: string;
      linescores: any[];
    }[] = [];

    for (const c of competitors) {
      const team = c.team?.$ref
        ? await this.fetchJson<any>(c.team.$ref, 5000)
        : c.team;
      const teamName = team?.name || 'Team';
      const teamShortName = team?.abbreviation || this.getAbbr(teamName);

      const lsObj = c.linescores?.$ref
        ? await this.fetchJson<any>(c.linescores.$ref, 5000)
        : c.linescores;
      const linescores = Array.isArray(lsObj?.items) ? lsObj.items : [];

      teamDataList.push({
        teamId: String(c.id),
        teamName,
        teamShortName,
        linescores,
      });
    }

    // Gather all distinct innings periods (e.g. 1, 2)
    const periods = new Set<number>();
    teamDataList.forEach((td) => {
      td.linescores.forEach((ls) => {
        if (ls.period) periods.add(ls.period);
      });
    });

    const sortedPeriods = Array.from(periods).sort((a, b) => a - b);
    const inningsList: ScorecardInnings[] = [];

    for (const period of sortedPeriods) {
      // Find the batting team and bowling team for this period
      let battingTeamData = teamDataList.find((td) => {
        const ls = td.linescores.find((l) => l.period === period);
        return ls?.isBatting === true || (ls && ls.runs > 0);
      });

      let bowlingTeamData = teamDataList.find((td) => td !== battingTeamData);

      if (!battingTeamData) {
        battingTeamData = teamDataList[period % 2 === 1 ? 0 : 1] || teamDataList[0];
        bowlingTeamData = teamDataList.find((td) => td !== battingTeamData) || teamDataList[1];
      }

      const batLs = battingTeamData?.linescores.find((l) => l.period === period);
      const bowlLs = bowlingTeamData?.linescores.find((l) => l.period === period);

      const runs = batLs?.runs || 0;
      const wickets = batLs?.wickets || 0;
      const overs = batLs?.overs || 0;
      const runRate = overs > 0 ? Number((runs / overs).toFixed(2)) : 0;

      // Extract Batters
      const batsmen: ScorecardBatsman[] = [];
      const batLeadersObj = batLs?.leaders?.$ref
        ? await this.fetchJson<any>(batLs.leaders.$ref, 5000)
        : batLs?.leaders;

      if (batLeadersObj?.categories) {
        const runCategory = batLeadersObj.categories.find(
          (cat: any) => cat.name === 'runs'
        );
        if (runCategory?.leaders) {
          for (let bIdx = 0; bIdx < runCategory.leaders.length; bIdx++) {
            const ldr = runCategory.leaders[bIdx];
            const name = await this.getAthleteName(ldr.athlete?.$ref);
            const r = parseInt(ldr.value || '0', 10);
            const b = parseInt(ldr.balls || '0', 10);
            const fours = parseInt(ldr.fours || '0', 10);
            const sixes = parseInt(ldr.sixes || '0', 10);
            const sr = b > 0 ? Number(((r / b) * 100).toFixed(2)) : 0;

            batsmen.push({
              id: bIdx + 1,
              name,
              runs: r,
              balls: b,
              fours,
              sixes,
              strikeRate: sr,
              outDesc: r > 0 ? 'dismissed' : 'not out',
              isNotOut: false,
            });
          }
        }
      }

      // Extract Bowlers (from opposing team's period leaders)
      const bowlers: ScorecardBowler[] = [];
      const bowlLeadersObj = bowlLs?.leaders?.$ref
        ? await this.fetchJson<any>(bowlLs.leaders.$ref, 5000)
        : bowlLs?.leaders;

      if (bowlLeadersObj?.categories) {
        const wicketCategory = bowlLeadersObj.categories.find(
          (cat: any) => cat.name === 'wickets'
        );
        if (wicketCategory?.leaders) {
          for (let bwIdx = 0; bwIdx < wicketCategory.leaders.length; bwIdx++) {
            const ldr = wicketCategory.leaders[bwIdx];
            const name = await this.getAthleteName(ldr.athlete?.$ref);
            const w = parseInt(ldr.value || '0', 10);
            const r = parseInt(ldr.runs || '0', 10);
            const ov = parseFloat(ldr.overs || '0');
            const maidens = parseInt(ldr.maidens || '0', 10);
            const eco = parseFloat(ldr.economyRate || '0');

            bowlers.push({
              id: bwIdx + 1,
              name,
              overs: ov,
              maidens,
              runs: r,
              wickets: w,
              economy: eco,
            });
          }
        }
      }

      inningsList.push({
        inningsId: period,
        teamName: battingTeamData.teamName,
        teamShortName: battingTeamData.teamShortName,
        runs,
        wickets,
        overs,
        runRate,
        batsmen,
        bowlers,
      });
    }

    return {
      success: true,
      provider: 'ESPN Cricinfo International',
      matchTitle,
      status,
      seriesName,
      venue,
      dateTimeGMT,
      toss,
      result,
      innings: inningsList,
      isFallback: inningsList.length === 0,
    };
  }

  /**
   * Helper to parse team name from title string
   */
  private static extractTeamFromTitle(title: string, index: number): string {
    const parts = title.split(/\s+(?:v|vs)\s+/i);
    return parts[index]?.trim() || `Team ${index + 1}`;
  }

  /**
   * Generate clean 3-4 character abbreviation for team
   */
  private static getAbbr(name: string): string {
    const isW = /women/i.test(name);
    const clean = name.replace(/women/gi, '').trim();
    const parts = clean.split(/\s+/);
    let abbr =
      parts.length >= 2
        ? parts.map((p) => p[0]).join('').toUpperCase()
        : clean.slice(0, 3).toUpperCase();
    return isW ? `${abbr}-W` : abbr;
  }
}
