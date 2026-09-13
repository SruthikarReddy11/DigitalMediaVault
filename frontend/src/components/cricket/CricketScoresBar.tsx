import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCw,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  CircleDot,
  Radio,
} from 'lucide-react';
import { api } from '../../services/api';

export interface CricketTeamScore {
  name: string;
  score: string;
  isBatting: boolean;
}

export interface CricketMatch {
  id: string;
  title: string;
  team1: CricketTeamScore;
  team2: CricketTeamScore;
  status: 'LIVE' | 'COMPLETED' | 'UPCOMING';
  statusText: string;
  cricinfoLink: string;
  pubDate?: string;
}

interface CricketScoresBarProps {
  onSelectMatch?: (match: CricketMatch | null) => void;
  selectedMatchId?: string | null;
  onOpenScorecard?: (match: CricketMatch) => void;
}

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

  // Client-side fallback parser in case backend is offline/standalone
  const parseXmlClientSide = (xml: string): CricketMatch[] => {
    const list: CricketMatch[] = [];
    const itemRegex =
      /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<guid>([\s\S]*?)<\/guid>[\s\S]*?<\/item>/gi;

    let match: RegExpExecArray | null;
    let idx = 0;

    const parseTeam = (str: string): CricketTeamScore => {
      let s = str.trim();
      const isBatting = s.includes('*');
      s = s.replace(/\*/g, '').trim();
      const scoreMatch = s.match(/(\d+[\d\/\s&]*\d+|\d+[\d\/]*)$/);
      if (scoreMatch) {
        const score = scoreMatch[0].trim();
        const name = s.slice(0, s.lastIndexOf(score)).trim();
        return { name: name || s, score, isBatting };
      }
      return { name: s, score: '', isBatting };
    };

    while ((match = itemRegex.exec(xml)) !== null) {
      idx++;
      const rawTitle = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      const link = match[2].trim();
      const guid = match[4].trim();
      const idMatch = guid.match(/(\d+)\.html/) || link.match(/(\d+)\.html/);
      const matchId = idMatch ? idMatch[1] : `match-${idx}`;

      const vsParts = rawTitle.split(/\s+(?:v|vs)\s+/i);

      if (vsParts.length >= 2) {
        const team1 = parseTeam(vsParts[0]);
        const team2 = parseTeam(vsParts[1]);

        let status: 'LIVE' | 'COMPLETED' | 'UPCOMING' = 'UPCOMING';
        let statusText = 'Scheduled';

        if (team1.isBatting || team2.isBatting) {
          status = 'LIVE';
          const battingTeam = team1.isBatting ? team1.name : team2.name;
          statusText = `${battingTeam} Batting`;
        } else if (team1.score && team2.score) {
          status = 'COMPLETED';
          statusText = 'Match Concluded';
        } else if (team1.score || team2.score) {
          status = 'LIVE';
          statusText = 'In Progress';
        }

        list.push({
          id: matchId,
          title: rawTitle,
          team1,
          team2,
          status,
          statusText,
          cricinfoLink: link,
        });
      }
    }
    return list;
  };

  const fetchScores = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      // 1. Try our backend API first
      const res = await api.get('/cricket/live-scores', { timeout: 6000 });
      if (res.data && Array.isArray(res.data.matches) && res.data.matches.length > 0) {
        setMatches(res.data.matches);
        setLastUpdatedTime(new Date());
        setSecondsAgo(0);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
    } catch {
      // Backend failed or unreachable, try fallback
    }

    // 2. Client-side fallback via public CORS proxy
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        'https://static.cricinfo.com/rss/livescores.xml'
      )}`;
      const res = await fetch(proxyUrl, { cache: 'no-store' });
      if (res.ok) {
        const xmlText = await res.text();
        const parsed = parseXmlClientSide(xmlText);
        if (parsed.length > 0) {
          setMatches(parsed);
          setLastUpdatedTime(new Date());
          setSecondsAgo(0);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }
    } catch {
      // Fallback failed
    }

    // 3. Fallback mock if completely offline
    if (matches.length === 0) {
      setMatches([
        {
          id: 'mock-1',
          title: 'India 183/4 * v South Africa 180/7',
          team1: { name: 'India', score: '183/4', isBatting: true },
          team2: { name: 'South Africa', score: '180/7', isBatting: false },
          status: 'LIVE',
          statusText: 'India needs 2 runs to win',
          cricinfoLink: 'https://www.espncricinfo.com',
        },
        {
          id: 'mock-2',
          title: 'Australia 285/6 v England 240/10',
          team1: { name: 'Australia', score: '285/6', isBatting: false },
          team2: { name: 'England', score: '240/10', isBatting: false },
          status: 'COMPLETED',
          statusText: 'Australia won by 45 runs',
          cricinfoLink: 'https://www.espncricinfo.com',
        },
        {
          id: 'mock-3',
          title: 'Pakistan v New Zealand',
          team1: { name: 'Pakistan', score: '', isBatting: false },
          team2: { name: 'New Zealand', score: '', isBatting: false },
          status: 'UPCOMING',
          statusText: 'Match starts at 7:00 PM IST',
          cricinfoLink: 'https://www.espncricinfo.com',
        },
      ]);
    }

    setLastUpdatedTime(new Date());
    setSecondsAgo(0);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [matches.length]);

  // Initial load and polling every 30 seconds
  useEffect(() => {
    fetchScores();

    const pollTimer = setInterval(() => {
      fetchScores();
    }, 30000);

    const secondsTimer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(secondsTimer);
    };
  }, [fetchScores]);

  // Scroll controls
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filtered matches
  const filteredMatches = matches.filter((m) => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  const liveCount = matches.filter((m) => m.status === 'LIVE').length;

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3.5">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500/20 to-red-500/20 border border-rose-500/30 text-rose-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide flex items-center gap-1.5">
                <span>Live Cricket Scores</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              {liveCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                  {liveCount} Live Now
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Real-time feeds from ESPN Cricinfo</span>
              <span>•</span>
              <span className="text-slate-500">Auto-refreshes (30s)</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({matches.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('LIVE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                filter === 'LIVE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>Live ({liveCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Result
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchScores(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            title="Refresh Live Scores"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span className="hidden sm:inline">
              {secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`}
            </span>
          </button>

          {/* Scroll arrows */}
          <div className="hidden sm:flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Matches Horizontal Scroll / Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 gap-3 text-slate-400 text-xs">
          <RotateCw className="w-4 h-4 animate-spin text-brand-400" />
          <span>Fetching real-time cricket scores...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-6 bg-slate-950/40 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
          No matches found under this filter.
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent snap-x"
        >
          {filteredMatches.map((match) => {
            const isSelected = selectedMatchId === match.id;
            const isLive = match.status === 'LIVE';

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
                className={`flex-shrink-0 w-72 sm:w-80 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer border snap-start relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-brand-900/40 via-slate-900 to-slate-950 border-brand-500 shadow-lg shadow-brand-500/20 ring-1 ring-brand-500'
                    : isLive
                    ? 'bg-slate-950/80 hover:bg-slate-900/90 border-rose-500/40 hover:border-rose-500 shadow-md'
                    : 'bg-slate-950/60 hover:bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Match Header: Status & Scorecard Button */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/70 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {isLive ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                        <span>LIVE</span>
                      </span>
                    ) : match.status === 'COMPLETED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        COMPLETED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                        UPCOMING
                      </span>
                    )}

                    <span className="text-slate-400 font-medium truncate max-w-[130px]">
                      {match.statusText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenScorecard) {
                        onOpenScorecard(match);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 font-bold transition shrink-0 text-[10px] border border-brand-500/40 cursor-pointer"
                    title="View full detailed scorecard in this website"
                  >
                    <span>Full Scorecard</span>
                  </button>
                </div>

                {/* Teams & Scores */}
                <div className="py-2.5 space-y-2">
                  {/* Team 1 */}
                  <div
                    className={`flex items-center justify-between gap-2 p-1.5 rounded-xl transition ${
                      match.team1.isBatting
                        ? 'bg-rose-500/10 border border-rose-500/30 text-white font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      {match.team1.isBatting && (
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
                      )}
                      <span className="text-xs truncate font-semibold">
                        {match.team1.name || 'Team 1'}
                      </span>
                    </div>

                    <div className="text-xs font-mono font-bold text-white shrink-0">
                      {match.team1.score ? (
                        <span>{match.team1.score}</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Yet to bat</span>
                      )}
                      {match.team1.isBatting && (
                        <span className="text-rose-400 text-xs ml-0.5">*</span>
                      )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div
                    className={`flex items-center justify-between gap-2 p-1.5 rounded-xl transition ${
                      match.team2.isBatting
                        ? 'bg-rose-500/10 border border-rose-500/30 text-white font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      {match.team2.isBatting && (
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
                      )}
                      <span className="text-xs truncate font-semibold">
                        {match.team2.name || 'Team 2'}
                      </span>
                    </div>

                    <div className="text-xs font-mono font-bold text-white shrink-0">
                      {match.team2.score ? (
                        <span>{match.team2.score}</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Yet to bat</span>
                      )}
                      {match.team2.isBatting && (
                        <span className="text-rose-400 text-xs ml-0.5">*</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer / Select Prompt */}
                <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate text-brand-400 font-medium group-hover:underline">
                    Click to view full scorecard
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800 group-hover:bg-brand-500/20 text-slate-300 group-hover:text-brand-300 text-[9px] font-bold transition">
                    VIEW
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
