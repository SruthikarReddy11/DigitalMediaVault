import { api } from './api';
import { TripPlan, CreateTripPlanInput, Place } from '../types';
import { placesApi } from './placesApi';

export const tripPlansApi = {
  /**
   * List all trip plans
   */
  listTrips: async (): Promise<TripPlan[]> => {
    const res = await api.get('/trip-plans');
    return res.data.data;
  },

  /**
   * Get single trip plan with places, expenses, notes, files
   */
  getTripById: async (id: string): Promise<TripPlan> => {
    const res = await api.get(`/trip-plans/${id}`);
    return res.data.data;
  },

  /**
   * Create a new trip plan
   */
  createTrip: async (data: CreateTripPlanInput): Promise<TripPlan> => {
    const res = await api.post('/trip-plans', data);
    return res.data.data;
  },

  /**
   * Update an existing trip plan
   */
  updateTrip: async (id: string, data: Partial<CreateTripPlanInput>): Promise<TripPlan> => {
    const res = await api.put(`/trip-plans/${id}`, data);
    return res.data.data;
  },

  /**
   * Delete trip plan
   */
  deleteTrip: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/trip-plans/${id}`);
    return res.data.data;
  },

  /**
   * Add an existing place to trip plan
   */
  addPlaceToTrip: async (tripId: string, placeId: string): Promise<TripPlan> => {
    const res = await api.post(`/trip-plans/${tripId}/places`, { placeId });
    return res.data.data;
  },

  /**
   * Remove place from trip plan
   */
  removePlaceFromTrip: async (tripId: string, placeId: string): Promise<TripPlan> => {
    const res = await api.delete(`/trip-plans/${tripId}/places/${placeId}`);
    return res.data.data;
  },

  /**
   * Resolve a Google Maps URL, save it as a Place, and add it directly to this Trip
   */
  createAndAddPlaceFromMapUrl: async (tripId: string, googleMapsUrl: string): Promise<{ trip: TripPlan; place: Place }> => {
    // 1. Resolve preview
    const resolved = await placesApi.resolveUrl(googleMapsUrl);
    
    // 2. Create the place
    const newPlace = await placesApi.createPlace({
      googleMapsUrl,
      name: resolved.name || 'Saved Place',
      description: resolved.description || undefined,
      address: resolved.address || undefined,
      city: resolved.city || undefined,
      state: resolved.state || undefined,
      country: resolved.country || undefined,
      latitude: resolved.latitude ?? undefined,
      longitude: resolved.longitude ?? undefined,
      category: resolved.category || undefined,
      rating: resolved.rating ?? undefined,
      userRatingsTotal: resolved.userRatingsTotal ?? undefined,
      phoneNumber: resolved.phoneNumber || undefined,
      website: resolved.website || undefined,
      openingHours: resolved.openingHours || undefined,
      imageUrl: resolved.imageUrl || undefined,
      photoReference: resolved.photoReference || undefined,
      tripPlanId: tripId,
    });

    // 3. Add to trip if not automatically linked
    const updatedTrip = await tripPlansApi.addPlaceToTrip(tripId, newPlace.id);

    return { trip: updatedTrip, place: newPlace };
  },
};
