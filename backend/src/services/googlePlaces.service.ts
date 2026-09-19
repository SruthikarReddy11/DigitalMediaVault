export interface ResolvedPlaceData {
  placeId?: string | null;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl: string;
  category?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  phoneNumber?: string | null;
  website?: string | null;
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
  } | null;
  imageUrl?: string | null;
  photoReference?: string | null;
  photoAttributions?: string[];
  isFallback?: boolean;
}

export class GooglePlacesService {
  /**
   * Follow HTTP redirects to resolve short Google Maps links (e.g. goo.gl/maps, maps.app.goo.gl)
   */
  public static async expandShortUrl(rawUrl: string): Promise<string> {
    try {
      const parsed = new URL(rawUrl);
      if (
        parsed.hostname.includes('goo.gl') ||
        parsed.hostname.includes('maps.app.goo.gl') ||
        parsed.pathname.startsWith('/maps/dir/') ||
        rawUrl.length < 40
      ) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(rawUrl, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        clearTimeout(timeout);
        if (res.url && res.url !== rawUrl) {
          return res.url;
        }
      }
    } catch {
      // If expansion fails, proceed with original URL
    }
    return rawUrl;
  }

  /**
   * Parse place information and coordinates directly from a Google Maps URL
   */
  public static parseUrlMetadata(url: string): {
    placeName?: string;
    coordinates?: { lat: number; lng: number };
    placeId?: string;
    searchQuery?: string;
  } {
    const result: {
      placeName?: string;
      coordinates?: { lat: number; lng: number };
      placeId?: string;
      searchQuery?: string;
    } = {};

    try {
      const parsed = new URL(url);

      // Check place_id query param
      const qPlaceId = parsed.searchParams.get('query_place_id');
      if (qPlaceId) result.placeId = qPlaceId;

      // Extract place name from /maps/place/Place+Name/
      const placeMatch = parsed.pathname.match(/\/place\/([^\/@]+)/);
      if (placeMatch && placeMatch[1]) {
        result.placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }

      // Extract coordinates from @lat,lng
      const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        result.coordinates = {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2]),
        };
      }

      // Extract query param q or query
      const q = parsed.searchParams.get('q') || parsed.searchParams.get('query');
      if (q) {
        result.searchQuery = decodeURIComponent(q.replace(/\+/g, ' '));
        if (!result.placeName && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(result.searchQuery)) {
          result.placeName = result.searchQuery;
        }
      }
    } catch {}

    return result;
  }

  /**
   * Helper to format raw Google place type (e.g. tourist_attraction -> Tourist Attraction)
   */
  private static formatCategory(types?: string[]): string {
    if (!types || types.length === 0) return 'Point of Interest';
    const ignoreTypes = new Set(['point_of_interest', 'establishment', 'premise', 'geocode']);
    const meaningful = types.find((t) => !ignoreTypes.has(t)) || types[0];
    return meaningful
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /**
   * Resolve a Google Maps URL into structured place details using official Places API
   * with graceful fallback when API key is not present or lookup fails.
   */
  public static async resolvePlace(rawUrl: string): Promise<ResolvedPlaceData> {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new Error('Valid Google Maps URL is required.');
    }

    const cleanUrl = rawUrl.trim();
    const expandedUrl = await this.expandShortUrl(cleanUrl);
    const meta = this.parseUrlMetadata(expandedUrl);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // Graceful fallback when API key is not configured
      return {
        placeId: meta.placeId || null,
        name: meta.placeName || meta.searchQuery || 'Saved Place',
        address: meta.placeName ? `${meta.placeName}` : null,
        latitude: meta.coordinates?.lat || null,
        longitude: meta.coordinates?.lng || null,
        googleMapsUrl: expandedUrl,
        category: 'Travel & Place',
        rating: null,
        userRatingsTotal: null,
        phoneNumber: null,
        website: null,
        openingHours: null,
        imageUrl: null,
        photoReference: null,
        photoAttributions: [],
        isFallback: true,
      };
    }

    try {
      let placeId = meta.placeId;

      // 1. If we don't have placeId yet, search for the place using findplacefromtext
      if (!placeId) {
        const searchText = meta.placeName || meta.searchQuery;
        if (searchText) {
          const findUrl = new URL(
            'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
          );
          findUrl.searchParams.set('input', searchText);
          findUrl.searchParams.set('inputtype', 'textquery');
          findUrl.searchParams.set('fields', 'place_id,name,geometry,types');
          findUrl.searchParams.set('key', apiKey);

          if (meta.coordinates) {
            findUrl.searchParams.set(
              'locationbias',
              `point:${meta.coordinates.lat},${meta.coordinates.lng}`
            );
          }

          const findRes = await fetch(findUrl.toString());
          if (findRes.ok) {
            const findJson = await findRes.json();
            if (findJson.candidates && findJson.candidates.length > 0) {
              placeId = findJson.candidates[0].place_id;
            }
          }
        }
      }

      // 2. Fetch full Place Details if placeId is found
      if (placeId) {
        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.set('place_id', placeId);
        detailsUrl.searchParams.set(
          'fields',
          'place_id,name,formatted_address,address_components,geometry,photos,rating,user_ratings_total,types,international_phone_number,formatted_phone_number,website,opening_hours,url'
        );
        detailsUrl.searchParams.set('key', apiKey);

        const detRes = await fetch(detailsUrl.toString());
        if (detRes.ok) {
          const detJson = await detRes.json();
          if (detJson.status === 'OK' && detJson.result) {
            const r = detJson.result;

            // Extract address components
            let city: string | null = null;
            let state: string | null = null;
            let country: string | null = null;

            if (Array.isArray(r.address_components)) {
              for (const comp of r.address_components) {
                if (comp.types.includes('locality')) city = comp.long_name;
                if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                if (comp.types.includes('country')) country = comp.long_name;
              }
            }

            // Extract first photo & attributions
            let photoReference: string | null = null;
            let photoAttributions: string[] = [];
            let imageUrl: string | null = null;

            if (Array.isArray(r.photos) && r.photos.length > 0) {
              const firstPhoto = r.photos[0];
              photoReference = firstPhoto.photo_reference;
              photoAttributions = firstPhoto.html_attributions || [];
              imageUrl = `/api/places/photo?ref=${encodeURIComponent(photoReference!)}`;
            }

            // Opening hours
            let openingHours: any = null;
            if (r.opening_hours) {
              openingHours = {
                openNow: r.opening_hours.open_now,
                weekdayText: r.opening_hours.weekday_text || [],
              };
            }

            return {
              placeId: r.place_id || placeId,
              name: r.name || meta.placeName || 'Saved Place',
              address: r.formatted_address || null,
              city,
              state,
              country,
              latitude: r.geometry?.location?.lat || meta.coordinates?.lat || null,
              longitude: r.geometry?.location?.lng || meta.coordinates?.lng || null,
              googleMapsUrl: r.url || expandedUrl,
              category: this.formatCategory(r.types),
              rating: typeof r.rating === 'number' ? r.rating : null,
              userRatingsTotal: r.user_ratings_total || null,
              phoneNumber: r.international_phone_number || r.formatted_phone_number || null,
              website: r.website || null,
              openingHours,
              imageUrl,
              photoReference,
              photoAttributions,
              isFallback: false,
            };
          }
        }
      }
    } catch {
      // Fallback on network/API exception
    }

    // Graceful fallback
    return {
      placeId: meta.placeId || null,
      name: meta.placeName || meta.searchQuery || 'Saved Place',
      address: meta.placeName ? `${meta.placeName}` : null,
      latitude: meta.coordinates?.lat || null,
      longitude: meta.coordinates?.lng || null,
      googleMapsUrl: expandedUrl,
      category: 'Travel & Place',
      rating: null,
      userRatingsTotal: null,
      phoneNumber: null,
      website: null,
      openingHours: null,
      imageUrl: null,
      photoReference: null,
      photoAttributions: [],
      isFallback: true,
    };
  }

  /**
   * Fetch a photo stream from Google Places API for proxying
   */
  public static async fetchPhoto(
    photoReference: string,
    maxWidth = 800
  ): Promise<{ body: ReadableStream<Uint8Array> | null; contentType: string }> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key is not configured on server.');
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${encodeURIComponent(photoReference)}&key=${apiKey}`;
    const res = await fetch(photoUrl);

    if (!res.ok) {
      throw new Error(`Google photo fetch failed with status: ${res.status}`);
    }

    return {
      body: res.body,
      contentType: res.headers.get('content-type') || 'image/jpeg',
    };
  }
}
