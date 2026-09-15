import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Sparkles,
  Send,
  Image as ImageIcon,
  Music,
  Radio,
  Calendar as CalendarIcon,
  ShoppingBag,
  Heart,
  Play,
  Pause,
  Download,
  ExternalLink,
  RotateCw,
  CheckCircle2,
  FileText,
  Video,
  ArrowRight,
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useToast } from '../contexts/ToastContext';
import { formatBytes, formatDuration } from '../utils/formatters';
import { CricketScorecardModal } from '../components/cricket/CricketScorecardModal';
import { CricketMatch } from '../components/cricket/CricketScoresBar';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  action?: string;
  data?: any;
}

const PROMPT_SUGGESTIONS = [
  { label: 'Play DC songs', icon: Music, prompt: 'play DC songs', color: 'from-pink-500 to-rose-500' },
  { label: 'IND vs AFG scorecard', icon: Radio, prompt: 'IND vs AFG scorecard', color: 'from-blue-500 to-indigo-500' },
  { label: 'Add birthday event', icon: CalendarIcon, prompt: 'add event for 17-09-2026 as my birthday', color: 'from-emerald-500 to-teal-500' },
  { label: 'Upcoming schedule', icon: CalendarIcon, prompt: 'what are my upcoming calendar events?', color: 'from-purple-500 to-indigo-600' },
  { label: 'Products under ₹2000', icon: ShoppingBag, prompt: 'retrieve products pricing from 500 to 2000', color: 'from-amber-500 to-orange-500' },
  { label: 'Retrieve my PDF files', icon: FileText, prompt: 'retrieve my pdf files', color: 'from-sky-500 to-blue-500' },
  { label: 'Show my favorites', icon: Heart, prompt: 'show my favorites', color: 'from-rose-500 to-pink-500' },
];

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `👋 Welcome to your **Gemini AI Vault Assistant**!

I can help you navigate and control your entire library through natural conversation:
- 🎶 **Play Music**: *"play DC songs"*, *"play songs by Arijit Singh"*, *"play Believer"*
- 🏏 **Cricket Live**: *"IND vs AFG scorecard"*, *"current cricket matches"*
- 📅 **Calendar**: *"add event for 17-09-2026 as my birthday"*, *"schedule meeting tomorrow at 3pm"*, *"show my events"*
- 📄 **Files & Media**: *"retrieve my pdf files"*, *"find my videos"*, *"search documents"*
- 🛍️ **Products**: *"retrieve products pricing from 500 to 2000"*, *"products by Apple"*
- ⭐ **Favorites**: *"add [file] to favorites"*, *"show my favorites"*
- 💡 **General Knowledge & Any Tasks**: Ask me anything, plan tasks, write text, or get explanations!

How can I help you today?`,
      timestamp: new Date(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedScorecardMatch, setSelectedScorecardMatch] = useState<CricketMatch | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { playSongNow, currentTrack, isPlaying, togglePlay } = useAudioPlayer();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle message submission with conversation history
  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        sender: 'user',
        text,
        timestamp: new Date(),
      },
    ];

    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    // Prepare recent conversation history for multi-turn Gemini reasoning
    const history = messages
      .filter((m) => m.id !== 'welcome' && m.id !== 'welcome-reset')
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

    try {
      const res = await api.post('/ai/chat', {
        prompt: text,
        history,
      });
      const { action, reply, data } = res.data;

      // Handle Automatic Audio Playback if triggered
      if (action === 'PLAY_MUSIC' && data?.selectedSong) {
        try {
          playSongNow(data.selectedSong, data.queue || [data.selectedSong]);
          showSuccess(`Playing "${data.selectedSong.title}"`, 'Audio Player');
        } catch (err) {
          console.warn('Could not auto-start audio playback:', err);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply || 'Here is what I found:',
          timestamp: new Date(),
          action,
          data,
        },
      ]);
    } catch (err: any) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ Error: ${err.response?.data?.error?.message || err.message || 'Failed to process prompt. Please verify your connection or try again.'}`,
          timestamp: new Date(),
        },
      ]);
      showError(err.response?.data?.error?.message || err.message || 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut: Enter sends, Shift+Enter new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm mb-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                AI Vault Assistant
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold tracking-wide uppercase border border-indigo-200 dark:border-indigo-800">
                GEMINI AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Natural language music player, live cricket scores, calendar scheduling, file retrieval & conversational chat
            </p>
          </div>
        </div>

        {/* Quick Clear / Reset Button */}
        <button
          type="button"
          onClick={() => {
            setMessages([
              {
                id: 'welcome-reset',
                sender: 'ai',
                text: 'Chat history cleared. How can I assist you now?',
                timestamp: new Date(),
              },
            ]);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* CHAT FEED CONTAINER */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 space-y-6 shadow-inner">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 max-w-4xl ${
                isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  isAi
                    ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white'
                    : 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold text-xs'
                }`}
              >
                {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              {/* Message Content Bubble */}
              <div className={`space-y-3 max-w-[85%] sm:max-w-[78%]`}>
                <div
                  className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                    isAi
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}
                >
                  {/* Markdown formatted content */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>

                {/* 1. EMBEDDED ACTION: PLAY MUSIC */}
                {msg.action === 'PLAY_MUSIC' && msg.data?.selectedSong && (
                  <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        <Music className="w-4 h-4" />
                        <span>Now Playing from Personal Vault</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-4 bg-indigo-500 rounded-full animate-bounce"></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Album Cover */}
                      <div className="w-16 h-16 rounded-2xl bg-indigo-900/60 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                        {msg.data.selectedSong.coverUrl ? (
                          <img
                            src={getMediaUrl(msg.data.selectedSong.coverUrl)}
                            alt={msg.data.selectedSong.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className="w-8 h-8 text-indigo-400" />
                        )}
                      </div>

                      {/* Song Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-base truncate text-white">
                          {msg.data.selectedSong.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {msg.data.selectedSong.artist || 'Unknown Artist'}
                          {msg.data.selectedSong.album ? ` • ${msg.data.selectedSong.album}` : ''}
                        </p>
                        <p className="text-[11px] text-indigo-300 font-mono mt-0.5">
                          {formatDuration(msg.data.selectedSong.duration)}
                        </p>
                      </div>

                      {/* Play / Pause Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (currentTrack?.id === msg.data.selectedSong.id) {
                            togglePlay();
                          } else {
                            playSongNow(msg.data.selectedSong, msg.data.queue);
                          }
                        }}
                        className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
                      >
                        {currentTrack?.id === msg.data.selectedSong.id && isPlaying ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Quick Queue List if multiple found */}
                    {Array.isArray(msg.data.queue) && msg.data.queue.length > 1 && (
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-[11px] font-bold text-slate-400 mb-2">
                          More matching songs ({msg.data.queue.length}):
                        </p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {msg.data.queue.map((qSong: any) => (
                            <div
                              key={qSong.id}
                              onClick={() => playSongNow(qSong, msg.data.queue)}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer text-xs transition"
                            >
                              <span className="truncate max-w-[200px] font-medium">{qSong.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{formatDuration(qSong.duration)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. EMBEDDED ACTION: CRICKET MATCH & SCORECARD */}
                {msg.action === 'CRICKET' && msg.data?.activeMatch && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-black uppercase flex items-center gap-1.5 border border-rose-200 dark:border-rose-900">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span>{msg.data.activeMatch.status}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {msg.data.activeMatch.venue || 'International Arena'}
                      </span>
                    </div>

                    {/* Dual Teams Display */}
                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Team 1</p>
                        <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                          {msg.data.activeMatch.team1.name}
                        </h4>
                        <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {msg.data.activeMatch.team1.score || 'Yet to bat'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase">Team 2</p>
                        <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                          {msg.data.activeMatch.team2.name}
                        </h4>
                        <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {msg.data.activeMatch.team2.score || 'Yet to bat'}
                        </p>
                      </div>
                    </div>

                    {/* Match Status Banner */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {msg.data.activeMatch.statusText}
                    </div>

                    {/* Action Button: View Full Scorecard */}
                    <button
                      type="button"
                      onClick={() => setSelectedScorecardMatch(msg.data.activeMatch)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow cursor-pointer active:scale-98"
                    >
                      <span>Open Full Scorecard Breakdown</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 3. EMBEDDED ACTION: CALENDAR EVENT CREATED */}
                {msg.action === 'CALENDAR_EVENT_ADDED' && msg.data?.event && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Calendar Schedule Updated</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold uppercase">
                        {msg.data.event.type}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {msg.data.event.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {new Date(msg.data.event.startTime).toLocaleString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: msg.data.event.allDay ? undefined : '2-digit',
                            minute: msg.data.event.allDay ? undefined : '2-digit',
                          })}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/calendar')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>View in Calendar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 4. EMBEDDED ACTION: CALENDAR EVENTS LIST */}
                {msg.action === 'CALENDAR_EVENTS_LIST' && Array.isArray(msg.data?.events) && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Upcoming Calendar Schedule ({msg.data.events.length})
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {msg.data.events.map((ev: any) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                              {ev.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(ev.startTime).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase">
                            {ev.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. EMBEDDED ACTION: FILES / DOCUMENTS RETRIEVED */}
                {msg.action === 'FILES_RETRIEVED' && Array.isArray(msg.data?.files) && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Authorized Files Retrieved ({msg.data.files.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {msg.data.files.map((file: any) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-indigo-400 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {file.fileType === 'IMAGE' ? (
                              <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                            ) : file.fileType === 'VIDEO' ? (
                              <Video className="w-5 h-5 text-purple-500 shrink-0" />
                            ) : (
                              <FileText className="w-5 h-5 text-sky-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                {file.originalName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {formatBytes(file.size)}
                              </p>
                            </div>
                          </div>

                          <a
                            href={getMediaUrl(file.downloadUrl)}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. EMBEDDED ACTION: PRODUCTS WISHLIST RETRIEVED */}
                {msg.action === 'PRODUCTS_RETRIEVED' && Array.isArray(msg.data?.products) && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Products Wishlist ({msg.data.products.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {msg.data.products.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.title} className="w-full h-full object-contain p-1" />
                            ) : (
                              <ShoppingBag className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {p.title}
                              </h5>
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                {p.brand || p.store || 'Wishlist'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                ₹{p.price?.toLocaleString('en-IN') || '—'}
                              </span>
                              {p.url && (
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5 font-bold"
                                >
                                  <span>Store</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-md mr-auto">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="text-xs text-slate-500 font-medium ml-1">Gemini AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK SUGGESTION PILLS */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {PROMPT_SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap transition cursor-pointer shadow-sm active:scale-95"
            >
              <Icon className="w-3.5 h-3.5 text-indigo-500" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* INPUT AREA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-lg shrink-0 flex items-center gap-3">
        <textarea
          ref={textareaRef}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything: 'play Believer', 'IND vs AFG scorecard', 'schedule meeting tomorrow at 3pm', 'what is quantum computing?'..."
          rows={1}
          className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 max-h-28 py-1.5 px-2"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputPrompt.trim()}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-indigo-600/25 cursor-pointer active:scale-95 shrink-0"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* SCORECARD MODAL / VIEW IF MATCH CLICKED */}
      {selectedScorecardMatch && (
        <CricketScorecardModal
          match={selectedScorecardMatch}
          onClose={() => setSelectedScorecardMatch(null)}
        />
      )}
    </div>
  );
};

export default AiAssistantPage;
