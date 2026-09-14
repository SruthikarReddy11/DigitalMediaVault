import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Flame,
  ChevronLeft,
  ChevronRight,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';

export interface CricketTeamScore {
  name: string;
  shortName?: string;
  img?: string;
  score: string;
  overs?: string;
  isBatting: boolean;
}

export interface CricketMatch {
  id: string;
  title: string;
  matchType?: string;
  status: 'LIVE' | 'COMPLETED' | 'UPCOMING';
  statusText: string;
  venue?: string;
  dateTimeGMT?: string;
  cricinfoLink?: string;
  pubDate?: string;
  hasScorecard?: boolean;
  team1: CricketTeamScore;
  team2: CricketTeamScore;
}

interface CricketScoresBarProps {
  onSelectMatch?: (match: CricketMatch | null) => void;
  selectedMatchId?: string | null;
  onOpenScorecard?: (match: CricketMatch) => void;
}

// Helper to determine team theme badge colors
export const getTeamBadgeStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('india') || n.includes('ind'))
    return 'bg-gradient-to-tr from-sky-500 via-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20 ring-1 ring-sky-400/40';
  if (n.includes('sri lanka') || n.includes('sl'))
    return 'bg-gradient-to-tr from-blue-700 via-indigo-800 to-amber-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-amber-400/40';
  if (n.includes('south africa') || n.includes('sa') || n.includes('rsa'))
    return 'bg-gradient-to-tr from-emerald-600 to-green-800 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40';
  if (n.includes('australia') || n.includes('aus'))
    return 'bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50';
  if (n.includes('england') || n.includes('eng'))
    return 'bg-gradient-to-tr from-rose-600 to-red-800 text-white shadow-md shadow-rose-500/20 ring-1 ring-rose-400/40';
  if (n.includes('afghanistan') || n.includes('afg'))
    return 'bg-gradient-to-tr from-blue-600 via-cyan-700 to-teal-800 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40';
  if (n.includes('pakistan') || n.includes('pak'))
    return 'bg-gradient-to-tr from-emerald-700 to-teal-900 text-white shadow-md shadow-teal-500/20 ring-1 ring-emerald-400/40';
  if (n.includes('namibia') || n.includes('nam'))
    return 'bg-gradient-to-tr from-blue-600 via-indigo-700 to-red-600 text-white shadow-md ring-1 ring-blue-400/40';
  if (n.includes('zimbabwe') || n.includes('zim'))
    return 'bg-gradient-to-tr from-red-600 to-amber-600 text-white shadow-md ring-1 ring-red-400/40';
  return 'bg-gradient-to-tr from-slate-700 to-slate-800 text-white shadow-md';
};

// Helper to extract clean team abbreviations
export const getTeamAbbr = (name: string) => {
  const n = name.trim();
  const isWomen = /women/i.test(n);
  const clean = n.replace(/women/gi, '').trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    const abbr = words.map((w) => w[0]).join('').toUpperCase();
    return isWomen ? `${abbr}-W` : abbr;
  }
  const prefix = clean.slice(0, 3).toUpperCase();
  return isWomen ? `${prefix}-W` : prefix;
};

export const CricketScoresBar: React.FC<CricketScoresBarProps> = ({
  onSelectMatch,
  selectedMatchId,
  onOpenScorecard,
}) => {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'COMPLETED' | 'UPCOMING'>('ALL');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch scores from ESPN Cricinfo via backend
  const fetchScores = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await api.get('/cricket/matches', {
        params: { type: 'all' },
        timeout: 8000,
      });

      if (res.data && Array.isArray(res.data.matches) && res.data.matches.length > 0) {
        setMatches(res.data.matches);
        setLastUpdatedTime(new Date());
        setSecondsAgo(0);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
    } catch {
      // fallback to live-scores
      try {
        const res2 = await api.get('/cricket/live-scores', { timeout: 6000 });
        if (res2.data && Array.isArray(res2.data.matches) && res2.data.matches.length > 0) {
          setMatches(res2.data.matches);
          setLastUpdatedTime(new Date());
          setSecondsAgo(0);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      } catch {
        // silent catch
      }
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(() => {
      fetchScores();
    }, 30000);

    const secondsTimer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(secondsTimer);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  const liveCount = matches.filter((m) => m.status === 'LIVE').length;
  const upcomingCount = matches.filter((m) => m.status === 'UPCOMING').length;
  const completedCount = matches.filter((m) => m.status === 'COMPLETED').length;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Cricket Match Arena</span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </h3>
              {liveCount > 0 && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-widest shadow-sm">
                  {liveCount} LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
              <span>ESPN Cricinfo International</span>
              <span>•</span>
              <span className="text-slate-400">Live, Upcoming & Results</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({matches.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('LIVE')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'LIVE'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>Live ({liveCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('UPCOMING')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filter === 'UPCOMING'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Results ({completedCount})
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchScores(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-sm"
            title="Refresh Live Scores"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">
              {secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`}
            </span>
          </button>

          {/* Scroll Navigation */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer shadow-sm"
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer shadow-sm"
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MATCHES HORIZONTAL CAROUSEL */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-3 text-slate-500 text-xs">
          <RotateCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Ingesting real-time international match scorecards...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
          No matches found under this filter.
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent snap-x"
        >
          {filteredMatches.map((match) => {
            const isSelected = selectedMatchId === match.id;
            const isLive = match.status === 'LIVE';

            const t1Abbr = getTeamAbbr(match.team1.name);
            const t2Abbr = getTeamAbbr(match.team2.name);
            const t1Style = getTeamBadgeStyle(match.team1.name);
            const t2Style = getTeamBadgeStyle(match.team2.name);

            return (
              <div
                key={match.id}
                onClick={() => {
                  if (onOpenScorecard) {
                    onOpenScorecard(match);
                  } else {
                    onSelectMatch?.(isSelected ? null : match);
                  }
                }}
                className={`flex-shrink-0 w-80 sm:w-[350px] rounded-3xl p-4 transition-all duration-300 cursor-pointer border snap-start relative group flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : isLive
                    ? 'bg-white border-rose-200 hover:border-rose-400 shadow-sm hover:shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Top Subtle Ambient Accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                    isLive
                      ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-500 opacity-90'
                      : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-blue-500'
                  }`}
                />

                {/* Match Card Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {isLive ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-black border border-rose-200 tracking-wider shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span>LIVE</span>
                      </span>
                    ) : match.status === 'COMPLETED' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        RESULT
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        UPCOMING
                      </span>
                    )}

                    <span className="text-slate-600 font-medium truncate max-w-[140px]">
                      {match.statusText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenScorecard) onOpenScorecard(match);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 font-bold transition text-[10px] cursor-pointer shadow-sm"
                  >
                    <span>Full Scorecard</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                {/* TEAMS & SCORES STADIUM VIEW */}
                <div className="py-3 space-y-2.5">
                  {/* Team 1 */}
                  <div
                    className={`flex items-center justify-between gap-2 p-2 rounded-2xl transition-all ${
                      match.team1.isBatting
                        ? 'bg-rose-50/70 border-l-4 border-rose-500 shadow-sm'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 ${t1Style}`}
                      >
                        {t1Abbr.slice(0, 4)}
                      </div>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block">
                          {match.team1.name || 'Team 1'}
                        </span>
                        {match.team1.isBatting && (
                          <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                            <Flame className="w-3 h-3 animate-bounce text-amber-500" />
                            <span>Currently Batting</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {match.team1.score ? (
                        <div className="font-mono text-base font-black text-slate-900 tracking-tight">
                          {match.team1.score}
                          {match.team1.isBatting && (
                            <span className="text-rose-600 ml-0.5 text-sm font-bold">*</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Yet to bat</span>
                      )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div
                    className={`flex items-center justify-between gap-2 p-2 rounded-2xl transition-all ${
                      match.team2.isBatting
                        ? 'bg-rose-50/70 border-l-4 border-rose-500 shadow-sm'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 ${t2Style}`}
                      >
                        {t2Abbr.slice(0, 4)}
                      </div>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block">
                          {match.team2.name || 'Team 2'}
                        </span>
                        {match.team2.isBatting && (
                          <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                            <Flame className="w-3 h-3 animate-bounce text-amber-500" />
                            <span>Currently Batting</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {match.team2.score ? (
                        <div className="font-mono text-base font-black text-slate-900 tracking-tight">
                          {match.team2.score}
                          {match.team2.isBatting && (
                            <span className="text-rose-600 ml-0.5 text-sm font-bold">*</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Yet to bat</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Card Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="text-slate-500 truncate flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-indigo-600 transition-colors"></span>
                    <span className="truncate group-hover:text-slate-800 transition-colors">
                      {match.statusText || 'Click to view scorecard'}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 text-[10px] font-bold transition flex items-center gap-1 border border-slate-200">
                    <span>VIEW</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
