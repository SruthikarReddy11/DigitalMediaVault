export type PlaceStatus =
  | 'WANT_TO_VISIT'
  | 'PLANNED'
  | 'UPCOMING'
  | 'VISITED'
  | 'CANCELLED';

export interface PlaceReminder {
  id: string;
  placeId: string;
  userId: string;
  triggerTime: string;
  reminderOption: string;
  status: 'PENDING' | 'SENT' | 'DISMISSED' | 'COMPLETED';
  notifiedAt?: string | null;
  createdAt: string;
}

export interface ResolvedPlaceData {
  placeId?: string | null;
  name: string;
  description?: string | null;
  bestTimeToVisit?: string | null;
  price?: string | null;
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
  images?: string[];
  photoReference?: string | null;
  photoAttributions?: string[];
  isFallback?: boolean;
}

export interface Place {
  id: string;
  userId: string;
  placeId?: string | null;
  name: string;
  description?: string | null;
  bestTimeToVisit?: string | null;
  price?: string | null;
  images: string[];
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
  openingHours?: any;
  imageUrl?: string | null;
  photoReference?: string | null;
  photoAttributions?: string[];
  notes?: string | null;
  tags: string[];
  status: PlaceStatus;
  reminderDate?: string | null;
  reminderTime?: string | null;
  reminderOption?: string | null;
  createdAt: string;
  updatedAt: string;
  visitedAt?: string | null;
  reminders?: PlaceReminder[];
  tripPlans?: {
    tripPlan: {
      id: string;
      name: string;
      color?: string | null;
    };
  }[];
}

export interface CreatePlaceInput {
  googleMapsUrl: string;
  name?: string;
  description?: string;
  bestTimeToVisit?: string;
  price?: string;
  images?: string[];
  placeId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  rating?: number;
  userRatingsTotal?: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: any;
  imageUrl?: string;
  photoReference?: string;
  photoAttributions?: string[];
  notes?: string;
  tags?: string[];
  status?: PlaceStatus;
  reminderDate?: string | Date;
  reminderTime?: string;
  reminderOption?: string;
  tripPlanId?: string;
  syncCalendar?: boolean;
}

export interface UpdatePlaceInput {
  name?: string;
  description?: string | null;
  bestTimeToVisit?: string | null;
  price?: string | null;
  images?: string[];
  imageUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  category?: string | null;
  notes?: string | null;
  tags?: string[];
  status?: PlaceStatus;
  reminderDate?: string | Date | null;
  reminderTime?: string | null;
  reminderOption?: string | null;
  tripPlanId?: string | null;
  visitedAt?: string | Date | null;
}

export interface TripPlan {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImage?: string | null;
  color: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    places: number;
    notes: number;
    files: number;
    expenses: number;
    events: number;
  };
  places?: {
    id: string;
    placeId?: string;
    position: number;
    place: Place;
  }[];
  notes?: {
    id: string;
    note: {
      id: string;
      title: string;
      color: string;
      isPasswordProtected: boolean;
      tags: string[];
    };
  }[];
  files?: {
    id: string;
    file: {
      id: string;
      originalName: string;
      fileType: string;
      mimeType: string;
      size: number;
    };
  }[];
  expenses?: {
    id: string;
    expense: {
      id: string;
      amount: number;
      currency: string;
      date: string;
      category: string;
      description?: string | null;
    };
  }[];
  events?: {
    id: string;
    event: any;
  }[];
}

export interface CreateTripPlanInput {
  name: string;
  description?: string;
  destination?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  coverImage?: string;
  color?: string;
  status?: string;
  placeIds?: string[];
  noteIds?: string[];
  fileIds?: string[];
  expenseIds?: string[];
  eventIds?: string[];
}
