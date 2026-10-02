import * as cheerio from 'cheerio';

export interface WebsiteExtractedData {
  url: string;
  title: string;
  brief?: string;
  description?: string;
  thumbnailUrl?: string;
  favicon?: string;
  siteName?: string;
  suggestedTags: string[];
  themeColor?: string;
}

export class WebsiteExtractorService {
  /**
   * Normalize input URL by adding protocol if missing
   */
  public static normalizeUrl(rawUrl: string): string {
    let url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  /**
   * Resolve relative URL against base URL
   */
  private static resolveUrl(base: string, relative?: string | null): string | undefined {
    if (!relative || !relative.trim()) return undefined;
    try {
      return new URL(relative.trim(), base).toString();
    } catch {
      return relative;
    }
  }

  /**
   * Extract website preview, metadata, title, description, and images
   */
  public static async extract(rawUrl: string): Promise<WebsiteExtractedData> {
    const url = this.normalizeUrl(rawUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch website (HTTP ${response.status})`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Title extraction
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const twitterTitle = $('meta[name="twitter:title"]').attr('content');
      const htmlTitle = $('title').text().trim();
      const h1Title = $('h1').first().text().trim();
      const title = (ogTitle || twitterTitle || htmlTitle || h1Title || new URL(url).hostname).trim();

      // Description extraction
      const ogDesc = $('meta[property="og:description"]').attr('content');
      const twitterDesc = $('meta[name="twitter:description"]').attr('content');
      const metaDesc = $('meta[name="description"]').attr('content');
      const pDesc = $('p').first().text().trim();
      const description = (ogDesc || twitterDesc || metaDesc || pDesc || '').trim();

      // Thumbnail / OpenGraph image extraction
      const ogImage =
        $('meta[property="og:image:secure_url"]').attr('content') ||
        $('meta[property="og:image"]').attr('content');
      const twitterImage =
        $('meta[name="twitter:image"]').attr('content') ||
        $('meta[name="twitter:image:src"]').attr('content');
      const firstImage = $('main img, article img, #root img, img').first().attr('src');
      const rawThumb = ogImage || twitterImage || firstImage;
      const thumbnailUrl = this.resolveUrl(url, rawThumb);

      // Favicon extraction
      const iconHref =
        $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        $('link[rel="apple-touch-icon"]').attr('href');
      const favicon = this.resolveUrl(url, iconHref) || this.resolveUrl(url, '/favicon.ico');

      // Site Name & Theme Color
      const siteName =
        $('meta[property="og:site_name"]').attr('content') ||
        $('meta[name="application-name"]').attr('content') ||
        new URL(url).hostname;
      const themeColor = $('meta[name="theme-color"]').attr('content');

      // Keywords & Suggested Tags
      const rawKeywords =
        $('meta[name="keywords"]').attr('content') ||
        $('meta[property="article:tag"]').attr('content') ||
        '';
      const extractedKeywords = rawKeywords
        .split(/[,;|]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 1 && k.length < 30)
        .slice(0, 10);

      // Brief summary (first sentence of description or first 120 chars)
      let brief = '';
      if (description) {
        const sentenceMatch = description.match(/^([^.!?]+[.!?])/);
        brief = sentenceMatch ? sentenceMatch[1].trim() : description.slice(0, 140).trim();
      }

      return {
        url,
        title,
        brief,
        description,
        thumbnailUrl,
        favicon,
        siteName,
        suggestedTags: extractedKeywords,
        themeColor,
      };
    } catch (err: any) {
      // Graceful fallback with hostname if network request fails or times out
      try {
        const parsed = new URL(url);
        const hostName = parsed.hostname.replace(/^www\./, '');
        const cleanName = hostName.split('.')[0];
        const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        return {
          url,
          title: capitalized || 'Web Project',
          brief: `Live project deployed at ${parsed.hostname}`,
          description: '',
          suggestedTags: [],
        };
      } catch {
        return {
          url,
          title: 'Web Project',
          brief: 'Deployed web application',
          description: '',
          suggestedTags: [],
        };
      }
    }
  }
}
