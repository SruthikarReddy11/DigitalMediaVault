import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarHeader,
  CalendarViewMode,
} from '../components/calendar/CalendarHeader';
import { CalendarSidebar } from '../components/calendar/CalendarSidebar';
import { CalendarMonthView } from '../components/calendar/CalendarMonthView';
import { CalendarWeekView } from '../components/calendar/CalendarWeekView';
import { CalendarDayView } from '../components/calendar/CalendarDayView';
import { EventModal } from '../components/calendar/EventModal';
import { ExpiryDateModal } from '../components/calendar/ExpiryDateModal';
import { EventDetailsModal } from '../components/calendar/EventDetailsModal';
import { VideoPlayerModal } from '../components/video/VideoPlayerModal';
import { ImageLightbox } from '../components/gallery/ImageLightbox';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import {
  CalendarEvent,
  CalendarEventType,
  CreateEventPayload,
  UpdateEventPayload,
  FileItem,
} from '../types';
import {
  isExpiryEvent,
} from '../utils/calendarHelpers';
import { calendarApi } from '../services/calendarApi';
import { useToast } from '../contexts/ToastContext';
import { Loader2 } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const { success, error } = useToast();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedType, setSelectedType] = useState<CalendarEventType | 'ALL' | 'EXPIRIES'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [initialCreateDate, setInitialCreateDate] = useState<Date | null>(null);

  // Direct file preview modals
  const [previewVideo, setPreviewVideo] = useState<FileItem | null>(null);
  const [previewImages, setPreviewImages] = useState<FileItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Calculate range bounds for current view
  const calculateRange = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'month') {
      const start = new Date(year, month - 1, 20); // 10 days before
      const end = new Date(year, month + 2, 10); // 10 days after
      return { start, end };
    }

    if (viewMode === 'week') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(currentDate);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    // day view
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [currentDate, viewMode]);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const { start, end } = calculateRange();

      const filters: any = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
      // If it's a specific enum type, filter by it on backend
      if (selectedType !== 'ALL' && selectedType !== 'EXPIRIES') {
        filters.type = selectedType;
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const list = await calendarApi.getEvents(filters);
      setEvents(list);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      error(err.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [calculateRange, selectedType, searchTerm, error]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events client-side for EXPIRIES or search query
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedType === 'EXPIRIES') {
        if (!isExpiryEvent(ev)) return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const titleMatch = ev.title.toLowerCase().includes(query);
        const descMatch = ev.description ? ev.description.toLowerCase().includes(query) : false;
        const locMatch = ev.location ? ev.location.toLowerCase().includes(query) : false;
        if (!titleMatch && !descMatch && !locMatch) return false;
      }
      return true;
    });
  }, [events, selectedType, searchTerm]);

  // Date navigation
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Create event action
  const handleOpenCreateModal = (date?: Date) => {
    setEventToEdit(null);
    setInitialCreateDate(date || currentDate);
    setIsEventModalOpen(true);
  };

  // Save Expiry action
  const handleOpenExpiryModal = (date?: Date) => {
    setInitialCreateDate(date || currentDate);
    setIsExpiryModalOpen(true);
  };

  // Inspect event details
  const handleSelectEvent = (ev: CalendarEvent) => {
    setSelectedEvent(ev);
    setIsDetailsModalOpen(true);
  };

  // Edit event action
  const handleOpenEditModal = (ev: CalendarEvent) => {
    setIsDetailsModalOpen(false);
    setEventToEdit(ev);
    setIsEventModalOpen(true);
  };

  // Save event (create or update standard event)
  const handleSaveEvent = async (data: CreateEventPayload | UpdateEventPayload) => {
    if (eventToEdit) {
      const targetId = eventToEdit.masterEventId || eventToEdit.id;
      await calendarApi.updateEvent(targetId, data);
      success('Event updated successfully');
    } else {
      await calendarApi.createEvent(data as CreateEventPayload);
      success('Event created successfully');
    }
    setIsEventModalOpen(false);
    fetchEvents();
    window.dispatchEvent(new CustomEvent('calendar_events_updated'));
  };

  // Save expiry date action
  const handleSaveExpiry = async (payload: CreateEventPayload) => {
    await calendarApi.createEvent(payload);
    success('Expiry date saved successfully');
    setIsExpiryModalOpen(false);
    fetchEvents();
    window.dispatchEvent(new CustomEvent('calendar_events_updated'));
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    await calendarApi.deleteEvent(eventId);
    success('Event deleted');
    setIsDetailsModalOpen(false);
    fetchEvents();
    window.dispatchEvent(new CustomEvent('calendar_events_updated'));
  };

  // Preview attached file
  const handlePreviewAttachedFile = (file: FileItem) => {
    if (file.fileType === 'IMAGE') {
      setPreviewImages([file]);
      setLightboxIndex(0);
    } else if (file.fileType === 'VIDEO') {
      setPreviewVideo(file);
    } else {
      setPreviewFile(file);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 pb-12">
      {/* Left Companion Panel: Actions, Filters, Search & Upcoming Expiries Watchlist */}
      <CalendarSidebar
        onNewEvent={() => handleOpenCreateModal()}
        onSaveExpiry={() => handleOpenExpiryModal()}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        events={events}
        onSelectEvent={handleSelectEvent}
      />

      {/* Right Column: Calendar Navigation Header + Interactive View */}
      <div className="flex-1 min-w-0 w-full space-y-4">
        <CalendarHeader
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onNewEvent={() => handleOpenCreateModal()}
          onSaveExpiry={() => handleOpenExpiryModal()}
        />

        {/* Main View Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[500px] bg-slate-900/40 border border-slate-800 rounded-2xl">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
            <p className="text-xs text-slate-400">Loading your schedule...</p>
          </div>
        ) : viewMode === 'month' ? (
          <CalendarMonthView
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onCreateEvent={handleOpenCreateModal}
          />
        ) : viewMode === 'week' ? (
          <CalendarWeekView
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onCreateEvent={handleOpenCreateModal}
          />
        ) : (
          <CalendarDayView
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onCreateEvent={handleOpenCreateModal}
          />
        )}
      </div>

      {/* Standard Event Create / Edit Modal */}
      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          eventToEdit={eventToEdit}
          initialDate={initialCreateDate}
          onSave={handleSaveEvent}
        />
      )}

      {/* Dedicated Save Expiry Date Modal */}
      {isExpiryModalOpen && (
        <ExpiryDateModal
          isOpen={isExpiryModalOpen}
          onClose={() => setIsExpiryModalOpen(false)}
          initialDate={initialCreateDate}
          onSave={handleSaveExpiry}
        />
      )}

      {/* Event Details Modal */}
      {isDetailsModalOpen && selectedEvent && (
        <EventDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          event={selectedEvent}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteEvent}
          onRefresh={() => {
            fetchEvents();
            calendarApi.getEventById(selectedEvent.masterEventId || selectedEvent.id).then((fresh) => {
              if (fresh) setSelectedEvent(fresh);
            });
          }}
          onPreviewFile={handlePreviewAttachedFile}
        />
      )}

      {/* Preview Modals */}
      {previewVideo && (
        <VideoPlayerModal
          video={previewVideo}
          isOpen={!!previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
      )}

      {previewImages.length > 0 && (
        <ImageLightbox
          images={previewImages}
          currentIndex={lightboxIndex}
          isOpen={previewImages.length > 0}
          onClose={() => setPreviewImages([])}
          onNavigate={setLightboxIndex}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};
