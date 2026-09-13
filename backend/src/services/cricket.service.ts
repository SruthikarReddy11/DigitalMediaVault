import https from 'https';

export interface CricketTeamScore {
  name: string;
  score: string;
  isBatting: boolean;
}

export interface CricketMatch {
  id: string;
  title: string;
  team1: CricketTeamScore;
  team2: CricketTeamScore;
  status: 'LIVE' | 'COMPLETED' | 'UPCOMING';
  statusText: string;
  cricinfoLink: string;
  pubDate?: string;
}

export interface CricketScoresResult {
  success: boolean;
  count: number;
  lastUpdated: string;
  matches: CricketMatch[];
  isCached?: boolean;
}

// In-memory cache for live scores
let cachedResult: CricketScoresResult | null = null;
let cacheExpiryTime: number = 0;
const CACHE_TTL_MS = 20 * 1000; // 20 seconds cache

export class CricketService {
  private static RSS_URL = 'https://static.cricinfo.com/rss/livescores.xml';

  /**
   * Fetches the raw XML from ESPN Cricinfo
   */
  private static fetchXml(): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.get(
        this.RSS_URL,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/xml,text/xml,*/*',
          },
          timeout: 8000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Cricinfo responded with status ${res.statusCode}`));
            return;
          }

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
        reject(new Error('Request to Cricinfo timed out'));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Parse team name, score string, and active batting flag
   */
  private static parseTeamString(str: string): CricketTeamScore {
    let s = str.trim();
    const isBatting = s.includes('*');
    s = s.replace(/\*/g, '').trim();

    // Match scores like '404/9 & 109/10' or '156/10' or '153/3' or '340 & 180/4'
    const scoreMatch = s.match(/(\d+[\d\/\s&]*\d+|\d+[\d\/]*)$/);
    if (scoreMatch) {
      const score = scoreMatch[0].trim();
      const name = s.slice(0, s.lastIndexOf(score)).trim();
      return {
        name: name || s,
        score,
        isBatting,
      };
    }

    return {
      name: s,
      score: '',
      isBatting,
    };
  }

  /**
   * Parse XML content into structured match objects
   */
  public static parseXmlToMatches(xml: string): CricketMatch[] {
    const matches: CricketMatch[] = [];
    const itemRegex =
      /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<guid>([\s\S]*?)<\/guid>[\s\S]*?<\/item>/gi;

    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = itemRegex.exec(xml)) !== null) {
      idx++;
      const rawTitle = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      const link = match[2].trim();
      const guid = match[4].trim();

      // Extract match ID from guid or link
      const idMatch = guid.match(/(\d+)\.html/) || link.match(/(\d+)\.html/);
      const matchId = idMatch ? idMatch[1] : `match-${idx}`;

      const vsParts = rawTitle.split(/\s+(?:v|vs)\s+/i);

      if (vsParts.length >= 2) {
        const team1 = this.parseTeamString(vsParts[0]);
        const team2 = this.parseTeamString(vsParts[1]);

        let status: 'LIVE' | 'COMPLETED' | 'UPCOMING' = 'UPCOMING';
        let statusText = 'Scheduled';

        if (team1.isBatting || team2.isBatting) {
          status = 'LIVE';
          const battingTeam = team1.isBatting ? team1.name : team2.name;
          statusText = `${battingTeam} Batting`;
        } else if (team1.score && team2.score) {
          status = 'COMPLETED';
          statusText = 'Match Concluded';
        } else if (team1.score || team2.score) {
          status = 'LIVE';
          statusText = 'In Progress';
        }

        matches.push({
          id: matchId,
          title: rawTitle,
          team1,
          team2,
          status,
          statusText,
          cricinfoLink: link,
        });
      } else {
        // Fallback for single title without "v"
        matches.push({
          id: matchId,
          title: rawTitle,
          team1: { name: rawTitle, score: '', isBatting: false },
          team2: { name: '', score: '', isBatting: false },
          status: 'UPCOMING',
          statusText: 'Upcoming',
          cricinfoLink: link,
        });
      }
    }

    return matches;
  }

  /**
   * Get Live Scores with in-memory caching and fallback
   */
  public static async getLiveScores(): Promise<CricketScoresResult> {
    const now = Date.now();

    // Check in-memory cache
    if (cachedResult && now < cacheExpiryTime) {
      return {
        ...cachedResult,
        isCached: true,
      };
    }

    try {
      const xml = await this.fetchXml();
      const matches = this.parseXmlToMatches(xml);

      const result: CricketScoresResult = {
        success: true,
        count: matches.length,
        lastUpdated: new Date().toISOString(),
        matches,
      };

      cachedResult = result;
      cacheExpiryTime = now + CACHE_TTL_MS;

      return result;
    } catch (err: any) {
      // If error occurs but we have existing cache (even if expired), return stale cache
      if (cachedResult) {
        return {
          ...cachedResult,
          isCached: true,
        };
      }

      // If no cache exists, return empty structure or fallback
      return {
        success: false,
        count: 0,
        lastUpdated: new Date().toISOString(),
        matches: [],
      };
    }
  }
}
