import * as cheerio from 'cheerio';

export interface ProductExtractedData {
  url: string;
  canonicalUrl?: string;
  title: string;
  description?: string;
  brand?: string;
  store: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  currency: string;
  currencySymbol: string;
  discountPercent?: number;
  imageUrl?: string;
  additionalImages: string[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  sku?: string;
}

export class ProductExtractorService {
  /**
   * Determine store name and default currency from URL
   */
  public static detectStore(url: string): { store: string; currency: string; currencySymbol: string } {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('amazon.')) return { store: 'Amazon', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('amzn.to') || host.includes('amzn.eu')) return { store: 'Amazon', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('flipkart.com') || host.includes('fkrt.it')) return { store: 'Flipkart', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('myntra.com')) return { store: 'Myntra', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('ajio.com')) return { store: 'Ajio', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('meesho.com')) return { store: 'Meesho', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('nykaa.com')) return { store: 'Nykaa', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('tatacliq.com')) return { store: 'Tata CLiQ', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('croma.com')) return { store: 'Croma', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('reliancedigital.in')) return { store: 'Reliance Digital', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('apple.com')) return { store: 'Apple', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('samsung.com')) return { store: 'Samsung', currency: 'INR', currencySymbol: '₹' };
      if (host.includes('ebay.')) return { store: 'eBay', currency: 'USD', currencySymbol: '$' };
      if (host.includes('walmart.com')) return { store: 'Walmart', currency: 'USD', currencySymbol: '$' };

      // Clean domain name fallback
      const cleanName = host.replace(/^www\./, '').split('.')[0];
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      return { store: capitalized || 'Other', currency: 'INR', currencySymbol: '₹' };
    } catch {
      return { store: 'Other', currency: 'INR', currencySymbol: '₹' };
    }
  }

  /**
   * Clean price string into a float
   */
  private static parsePrice(priceStr: any): number | undefined {
    if (typeof priceStr === 'number' && !isNaN(priceStr)) return priceStr;
    if (!priceStr || typeof priceStr !== 'string') return undefined;

    // Remove currency symbols, commas, spaces
    const cleaned = priceStr.replace(/[^\d.]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? undefined : num;
  }

  /**
   * Clean brand/seller title suffixes
   */
  private static cleanTitle(title: string, store: string): string {
    if (!title) return '';
    let cleaned = title.trim();

    // Strip common e-commerce suffix banners
    cleaned = cleaned.replace(/\s*\|\s*Flipkart\.com$/i, '');
    cleaned = cleaned.replace(/\s*:\s*Buy Online at Best Price in India - Amazon\.in$/i, '');
    cleaned = cleaned.replace(/\s*:\s*Amazon\.in:.*$/i, '');
    cleaned = cleaned.replace(/\s*Buy.*at Amazon\.in$/i, '');
    cleaned = cleaned.replace(/\s*Buy Online at Ajio\.com$/i, '');
    cleaned = cleaned.replace(/\s*Buy.*Online at Myntra$/i, '');
    cleaned = cleaned.replace(/\s*\|\s*Myntra$/i, '');
    cleaned = cleaned.replace(/\s*-\s*Ajio$/i, '');
    cleaned = cleaned.replace(/\s*\|\s*Tata CLiQ$/i, '');
    cleaned = cleaned.replace(/\s*\|\s*Croma$/i, '');

    return cleaned.trim();
  }

  /**
   * Main extractor function
   */
  public static async extract(inputUrl: string): Promise<ProductExtractedData> {
    let targetUrl = inputUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const { store, currency: defaultCurrency, currencySymbol: defaultSymbol } =
      this.detectStore(targetUrl);

    let html = '';
    let finalUrl = targetUrl;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-IN,en-GB,en-US;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      clearTimeout(timeoutId);
      finalUrl = response.url || targetUrl;
      html = await response.text();
    } catch (err: any) {
      console.warn(`[ProductExtractor] Network fetch notice for ${targetUrl}:`, err.message);
    }

    // Default fallback object
    const result: ProductExtractedData = {
      url: targetUrl,
      canonicalUrl: finalUrl,
      title: '',
      description: undefined,
      brand: undefined,
      store,
      category: 'General',
      price: undefined,
      originalPrice: undefined,
      currency: defaultCurrency,
      currencySymbol: defaultSymbol,
      discountPercent: undefined,
      imageUrl: undefined,
      additionalImages: [],
      rating: undefined,
      reviewCount: undefined,
      inStock: true,
      sku: undefined,
    };

    if (!html) {
      // Return basic inferred data if network was restricted
      result.title = `Product from ${store}`;
      return result;
    }

    const $ = cheerio.load(html);

    // 1. Check schema.org JSON-LD scripts
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = $(el).html();
        if (!raw) return;
        const parsed = JSON.parse(raw);

        const items = Array.isArray(parsed)
          ? parsed
          : parsed['@graph']
          ? parsed['@graph']
          : [parsed];

        for (const item of items) {
          if (
            item['@type'] === 'Product' ||
            item['@type'] === 'IndividualProduct' ||
            item['@type'] === 'ProductModel'
          ) {
            if (!result.title && item.name) result.title = String(item.name);
            if (!result.description && item.description) result.description = String(item.description);

            // Brand
            if (!result.brand) {
              if (typeof item.brand === 'string') result.brand = item.brand;
              else if (item.brand?.name) result.brand = String(item.brand.name);
            }

            // Image
            if (!result.imageUrl) {
              if (typeof item.image === 'string') {
                result.imageUrl = item.image;
              } else if (Array.isArray(item.image) && item.image.length > 0) {
                const first = item.image[0];
                result.imageUrl = typeof first === 'string' ? first : first?.url;
                result.additionalImages = item.image
                  .map((img: any) => (typeof img === 'string' ? img : img?.url))
                  .filter(Boolean);
              } else if (item.image?.url) {
                result.imageUrl = item.image.url;
              }
            }

            // Offers / Price
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offers) {
              if (result.price === undefined) {
                const p = this.parsePrice(offers.price || offers.lowPrice);
                if (p) result.price = p;
              }
              if (offers.priceCurrency) {
                result.currency = offers.priceCurrency;
                result.currencySymbol = offers.priceCurrency === 'INR' ? '₹' : offers.priceCurrency === 'USD' ? '$' : offers.priceCurrency;
              }
              if (offers.availability) {
                const av = String(offers.availability).toLowerCase();
                result.inStock = !av.includes('outofstock');
              }
            }

            // Rating
            if (result.rating === undefined && item.aggregateRating) {
              const r = parseFloat(item.aggregateRating.ratingValue);
              if (!isNaN(r)) result.rating = Number(r.toFixed(1));
              const rc = parseInt(item.aggregateRating.reviewCount || item.aggregateRating.ratingCount);
              if (!isNaN(rc)) result.reviewCount = rc;
            }

            // SKU
            if (!result.sku && item.sku) result.sku = String(item.sku);
          }
        }
      } catch {
        // Skip unparsable JSON-LD
      }
    });

    // 2. OpenGraph & Twitter tags extraction (fill in missing fields)
    if (!result.title) {
      result.title =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text();
    }

    if (!result.description) {
      result.description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content');
    }

    if (!result.imageUrl) {
      result.imageUrl =
        $('meta[property="og:image"]').attr('content') ||
        $('meta[property="og:image:secure_url"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('meta[name="twitter:image:src"]').attr('content');
    }

    // 3. Store-Specific DOM Parsers
    if (store === 'Flipkart') {
      // Flipkart specific title
      if (!result.title || result.title.length < 5) {
        const fkTitle = $('span.B_NuCI').text() || $('h1.yhB1nd').text() || $('span._35KyD6').text();
        if (fkTitle) result.title = fkTitle;
      }

      // Flipkart price
      if (result.price === undefined) {
        const fkPrice = $('div._30jeq3._16Jk6d').text() || $('div._30jeq3').first().text() || $('div.Nx9bqj.CxhGGd').text() || $('div.Nx9bqj').first().text();
        const p = this.parsePrice(fkPrice);
        if (p) result.price = p;
      }

      // Flipkart original MRP
      if (result.originalPrice === undefined) {
        const fkMrp = $('div._3I9_wc._2p6lqe').text() || $('div._3I9_wc').first().text() || $('div.yRaY8j.A68aAq').text() || $('div.yRaY8j').first().text();
        const mrp = this.parsePrice(fkMrp);
        if (mrp) result.originalPrice = mrp;
      }

      // Flipkart image
      if (!result.imageUrl) {
        const fkImg = $('img._396cs4').attr('src') || $('img.DByuf4').attr('src') || $('img._2r_T1I').attr('src');
        if (fkImg) result.imageUrl = fkImg;
      }

      // Flipkart rating
      if (result.rating === undefined) {
        const fkRating = $('div._3LWZlK').first().text() || $('div.XQDdHH').first().text();
        const r = parseFloat(fkRating);
        if (!isNaN(r)) result.rating = Number(r.toFixed(1));
      }
    } else if (store === 'Amazon') {
      // Amazon title
      if (!result.title || result.title.length < 5) {
        const azTitle = $('#productTitle').text() || $('span#title').text();
        if (azTitle) result.title = azTitle;
      }

      // Amazon price
      if (result.price === undefined) {
        const azPrice =
          $('.a-price .a-offscreen').first().text() ||
          $('#priceblock_ourprice').text() ||
          $('#priceblock_dealprice').text() ||
          $('#corePrice_desktop .a-offscreen').first().text() ||
          $('span.priceToPay span.a-offscreen').first().text();
        const p = this.parsePrice(azPrice);
        if (p) result.price = p;
      }

      // Amazon MRP / Original Price
      if (result.originalPrice === undefined) {
        const azMrp =
          $('.a-text-price span.a-offscreen').first().text() ||
          $('#listPrice').text() ||
          $('span.basisPrice span.a-offscreen').first().text();
        const mrp = this.parsePrice(azMrp);
        if (mrp) result.originalPrice = mrp;
      }

      // Amazon image
      if (!result.imageUrl) {
        const landingImg = $('#landingImage').attr('data-old-hires') || $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
        if (landingImg) result.imageUrl = landingImg;
      }

      // Amazon rating
      if (result.rating === undefined) {
        const azRating = $('span[data-hook="rating-out-of-text"]').text() || $('#acrPopover span.a-size-base').text() || $('.a-icon-alt').first().text();
        const match = azRating.match(/([\d.]+)\s*(out of|of)/i);
        if (match) {
          const r = parseFloat(match[1]);
          if (!isNaN(r)) result.rating = Number(r.toFixed(1));
        }
      }

      // Amazon reviews
      if (result.reviewCount === undefined) {
        const azReviews = $('#acrCustomerReviewText').text();
        const match = azReviews.replace(/,/g, '').match(/(\d+)/);
        if (match) {
          result.reviewCount = parseInt(match[1]);
        }
      }
    } else if (store === 'Myntra') {
      if (!result.brand) {
        const b = $('.pdp-title').text();
        if (b) result.brand = b.trim();
      }
      if (!result.title) {
        const t = $('.pdp-name').text();
        if (t) result.title = t.trim();
      }
      if (result.price === undefined) {
        const p = this.parsePrice($('.pdp-price strong').text() || $('.pdp-price').text());
        if (p) result.price = p;
      }
      if (result.originalPrice === undefined) {
        const mrp = this.parsePrice($('.pdp-mrp s').text() || $('.pdp-mrp').text());
        if (mrp) result.originalPrice = mrp;
      }
    } else if (store === 'Ajio') {
      if (!result.brand) {
        const b = $('.brand-name').text();
        if (b) result.brand = b.trim();
      }
      if (!result.title) {
        const t = $('.prod-name').text();
        if (t) result.title = t.trim();
      }
      if (result.price === undefined) {
        const p = this.parsePrice($('.prod-sp').text());
        if (p) result.price = p;
      }
      if (result.originalPrice === undefined) {
        const mrp = this.parsePrice($('.prod-cp').text());
        if (mrp) result.originalPrice = mrp;
      }
    }

    // 4. Calculate discount percentage
    if (result.price && result.originalPrice && result.originalPrice > result.price) {
      result.discountPercent = Math.round(
        ((result.originalPrice - result.price) / result.originalPrice) * 100
      );
    }

    // 5. Clean up title
    result.title = this.cleanTitle(result.title, store);
    if (!result.title) {
      result.title = `Product from ${store}`;
    }

    // 6. Infer category
    const lowerTitle = (result.title + ' ' + (result.description || '')).toLowerCase();
    if (lowerTitle.includes('phone') || lowerTitle.includes('laptop') || lowerTitle.includes('headphone') || lowerTitle.includes('tv') || lowerTitle.includes('tablet') || lowerTitle.includes('camera') || lowerTitle.includes('earbuds') || lowerTitle.includes('charger') || lowerTitle.includes('apple') || lowerTitle.includes('samsung')) {
      result.category = 'Electronics';
    } else if (lowerTitle.includes('shirt') || lowerTitle.includes('t-shirt') || lowerTitle.includes('jeans') || lowerTitle.includes('dress') || lowerTitle.includes('shoes') || lowerTitle.includes('sneakers') || lowerTitle.includes('watch') || lowerTitle.includes('jacket') || lowerTitle.includes('trousers') || lowerTitle.includes('saree') || lowerTitle.includes('kurta')) {
      result.category = 'Fashion';
    } else if (lowerTitle.includes('cream') || lowerTitle.includes('serum') || lowerTitle.includes('perfume') || lowerTitle.includes('lipstick') || lowerTitle.includes('shampoo') || lowerTitle.includes('skincare') || lowerTitle.includes('lotion')) {
      result.category = 'Beauty & Personal Care';
    } else if (lowerTitle.includes('chair') || lowerTitle.includes('table') || lowerTitle.includes('bed') || lowerTitle.includes('lamp') || lowerTitle.includes('pillow') || lowerTitle.includes('kitchen') || lowerTitle.includes('cookware') || lowerTitle.includes('bottle')) {
      result.category = 'Home & Kitchen';
    } else if (lowerTitle.includes('book') || lowerTitle.includes('novel') || lowerTitle.includes('edition') || lowerTitle.includes('paperback')) {
      result.category = 'Books';
    }

    return result;
  }
}
