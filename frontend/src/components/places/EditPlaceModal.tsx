import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Compass,
  AlertCircle,
  Check,
  Star,
} from 'lucide-react';
import { Place, PlaceStatus, UpdatePlaceInput } from '../../types';
import { placesApi } from '../../services/placesApi';

interface EditPlaceModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPlace: Place) => void;
}

const STATUS_OPTIONS: { value: PlaceStatus; label: string }[] = [
  { value: 'WANT_TO_VISIT', label: 'Want to Visit' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'VISITED', label: 'Visited' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const EditPlaceModal: React.FC<EditPlaceModalProps> = ({
  place,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !place) return null;

  const [name, setName] = useState(place.name || '');
  const [description, setDescription] = useState(place.description || '');
  const [bestTimeToVisit, setBestTimeToVisit] = useState(place.bestTimeToVisit || '');
  const [price, setPrice] = useState(place.price || '');
  const [country, setCountry] = useState(place.country || '');
  const [state, setState] = useState(place.state || '');
  const [city, setCity] = useState(place.city || '');
  const [address, setAddress] = useState(place.address || '');
  const [category, setCategory] = useState(place.category || '');
  const [status, setStatus] = useState<PlaceStatus>(place.status || 'WANT_TO_VISIT');
  const [notes, setNotes] = useState(place.notes || '');

  // Multiple Images State
  const initialImages = Array.isArray(place.images) && place.images.length > 0
    ? [...place.images]
    : place.imageUrl
    ? [place.imageUrl]
    : [];
  const [images, setImages] = useState<string[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageError, setNewImageError] = useState('');

  // Tags State
  const [tags, setTags] = useState<string[]>(place.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Reminder State
  const [reminderDate, setReminderDate] = useState(
    place.reminderDate ? new Date(place.reminderDate).toISOString().split('T')[0] : ''
  );
  const [reminderTime, setReminderTime] = useState(place.reminderTime || '09:00');
  const [reminderOption, setReminderOption] = useState(place.reminderOption || 'EXACT');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when place changes
  useEffect(() => {
    if (place) {
      setName(place.name || '');
      setDescription(place.description || '');
      setBestTimeToVisit(place.bestTimeToVisit || '');
      setPrice(place.price || '');
      setCountry(place.country || '');
      setState(place.state || '');
      setCity(place.city || '');
      setAddress(place.address || '');
      setCategory(place.category || '');
      setStatus(place.status || 'WANT_TO_VISIT');
      setNotes(place.notes || '');
      const imgs = Array.isArray(place.images) && place.images.length > 0
        ? [...place.images]
        : place.imageUrl
        ? [place.imageUrl]
        : [];
      setImages(imgs);
      setTags(place.tags || []);
      setReminderDate(
        place.reminderDate ? new Date(place.reminderDate).toISOString().split('T')[0] : ''
      );
      setReminderTime(place.reminderTime || '09:00');
      setReminderOption(place.reminderOption || 'EXACT');
      setError('');
    }
  }, [place]);

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setNewImageError('Please enter a valid URL (http:// or https://)');
      return;
    }
    if (images.includes(trimmed)) {
      setNewImageError('This image URL is already added.');
      return;
    }
    setImages([...images, trimmed]);
    setNewImageUrl('');
    setNewImageError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setImages((prev) => [...prev, result]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCover = (indexToCover: number) => {
    if (indexToCover === 0) return;
    const item = images[indexToCover];
    const rest = images.filter((_, idx) => idx !== indexToCover);
    setImages([item, ...rest]);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Place name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const payload: UpdatePlaceInput = {
        name: name.trim(),
        description: description.trim() || null,
        bestTimeToVisit: bestTimeToVisit.trim() || null,
        price: price.trim() || null,
        country: country.trim() || null,
        state: state.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        category: category.trim() || null,
        status,
        images,
        imageUrl: images.length > 0 ? images[0] : null,
        notes: notes.trim() || null,
        tags,
        reminderDate: reminderDate ? new Date(`${reminderDate}T${reminderTime}:00`) : null,
        reminderTime: reminderDate ? reminderTime : null,
        reminderOption: reminderDate ? reminderOption : null,
      };

      const updated = await placesApi.updatePlace(place.id, payload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update place:', err);
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to update place.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Place Details</h2>
              <p className="text-xs text-slate-400">Update destination info, photos, and travel schedule</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Place Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Place Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amber Palace, Jaipur"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Historical Landmark, Beach, Cafe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlaceStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Best Time to Visit
                </label>
                <input
                  type="text"
                  value={bestTimeToVisit}
                  onChange={(e) => setBestTimeToVisit(e.target.value)}
                  placeholder="e.g. October to March, Winter, Sunrise"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Price / Entry Fee / Budget
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. ₹500 / person, Free, $25"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Place Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Write a brief overview of this destination, special highlights, attractions, architecture, or history..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Location Breakdown */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Location Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  City / Town
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Agra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  State / Region
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Multiple Images Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Gallery & Images ({images.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">First image is the primary cover</span>
            </div>

            {/* Thumbnail Row */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-2xl overflow-hidden aspect-square border-2 group bg-slate-950/60 ${
                      idx === 0
                        ? 'border-cyan-500 shadow-md shadow-cyan-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-cyan-500 text-slate-950">
                        COVER
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          className="px-2 py-1 rounded-lg bg-cyan-600 text-white text-[10px] font-bold hover:bg-cyan-500 transition"
                          title="Set as cover image"
                        >
                          Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No images added yet. Add image URLs or upload local images below.
              </div>
            )}

            {/* Add Image Inputs */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => {
                    setNewImageUrl(e.target.value);
                    setNewImageError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="Paste image URL (https://...)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-xs text-white focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </button>

                <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5 text-pink-400" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {newImageError && (
                <p className="text-[11px] text-rose-400">{newImageError}</p>
              )}
            </div>
          </div>

          {/* Reminder Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Visit Reminder</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Visit Date
                </label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-xs text-white focus:outline-none transition cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  disabled={!reminderDate}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-xs text-white focus:outline-none transition disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Alert Offset
                </label>
                <select
                  value={reminderOption}
                  disabled={!reminderDate}
                  onChange={(e) => setReminderOption(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-xs text-white focus:outline-none transition disabled:opacity-40 cursor-pointer"
                >
                  <option value="EXACT">Exact day & time</option>
                  <option value="ONE_DAY_BEFORE">1 day before</option>
                  <option value="ONE_WEEK_BEFORE">1 week before</option>
                  <option value="ONE_MONTH_BEFORE">1 month before</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Notes & Tags</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Personal Travel Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add private tips, transport notes, ticket links, must-try food..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-xs text-white focus:outline-none transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-400 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag and press Enter"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-xs text-white focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-900/90 backdrop-blur-md -mx-6 -mb-6 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
