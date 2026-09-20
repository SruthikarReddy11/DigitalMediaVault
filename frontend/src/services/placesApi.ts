import { api } from './api';
import {
  Place,
  CreatePlaceInput,
  UpdatePlaceInput,
  PlaceStatus,
  ResolvedPlaceData,
  TripPlan,
  CreateTripPlanInput,
} from '../types';

export const placesApi = {
  /**
   * Resolve a Google Maps URL into preview place details
   */
  resolveUrl: async (url: string): Promise<ResolvedPlaceData> => {
    const res = await api.post('/places/resolve', { url });
    return res.data.data;
  },

  /**
   * List saved places with optional filters
   */
  listPlaces: async (filters: {
    status?: PlaceStatus | 'ALL';
    search?: string;
    category?: string;
    city?: string;
    country?: string;
    tag?: string;
    sort?: string;
  } = {}): Promise<Place[]> => {
    const res = await api.get('/places', { params: filters });
    return res.data.data;
  },

  /**
   * Get single place by ID
   */
  getPlaceById: async (id: string): Promise<Place> => {
    const res = await api.get(`/places/${id}`);
    return res.data.data;
  },

  /**
   * Save a new place
   */
  createPlace: async (data: CreatePlaceInput): Promise<Place> => {
    const res = await api.post('/places', data);
    return res.data.data;
  },

  /**
   * Update existing place
   */
  updatePlace: async (id: string, data: UpdatePlaceInput): Promise<Place> => {
    const res = await api.put(`/places/${id}`, data);
    return res.data.data;
  },

  /**
   * Quick status change (e.g. Mark as Visited)
   */
  updateStatus: async (id: string, status: PlaceStatus): Promise<Place> => {
    const res = await api.patch(`/places/${id}/status`, { status });
    return res.data.data;
  },

  /**
   * Postpone a place reminder
   */
  postponeReminder: async (reminderId: string, minutes = 60): Promise<any> => {
    const res = await api.post(`/places/reminders/${reminderId}/postpone`, { minutes });
    return res.data.data;
  },

  /**
   * Delete place
   */
  deletePlace: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/places/${id}`);
    return res.data.data;
  },

  /**
   * Trip Plans
   */
  listTrips: async (): Promise<TripPlan[]> => {
    const res = await api.get('/trip-plans');
    return res.data.data;
  },

  getTripById: async (id: string): Promise<TripPlan> => {
    const res = await api.get(`/trip-plans/${id}`);
    return res.data.data;
  },

  createTrip: async (data: CreateTripPlanInput): Promise<TripPlan> => {
    const res = await api.post('/trip-plans', data);
    return res.data.data;
  },

  updateTrip: async (id: string, data: Partial<CreateTripPlanInput>): Promise<TripPlan> => {
    const res = await api.put(`/trip-plans/${id}`, data);
    return res.data.data;
  },

  deleteTrip: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/trip-plans/${id}`);
    return res.data.data;
  },

  /**
   * Add a place to a trip plan
   */
  addPlaceToTrip: async (tripId: string, placeId: string): Promise<TripPlan> => {
    const res = await api.post(`/trip-plans/${tripId}/places`, { placeId });
    return res.data.data;
  },

  /**
   * Remove a place from a trip plan
   */
  removePlaceFromTrip: async (tripId: string, placeId: string): Promise<TripPlan> => {
    const res = await api.delete(`/trip-plans/${tripId}/places/${placeId}`);
    return res.data.data;
  },
};
