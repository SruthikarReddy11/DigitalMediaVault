import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCw,
  ExternalLink,
  Flame,
  ChevronLeft,
  ChevronRight,
  Radio,
  Trophy,
  Zap,
  ArrowRight,
  Shield,
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

// Helper to determine team theme badge colors
export const getTeamBadgeStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('india') || n.includes('ind'))
    return 'bg-gradient-to-tr from-sky-500 via-blue-600 to-blue-800 text-white shadow-md shadow-blue-500/20 ring-1 ring-sky-400/40';
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
  return 'bg-gradient-to-tr from-slate-800 to-slate-900 text-slate-200 border border-slate-700/80 shadow-md';
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
      // Backend failed, try fallback
    }

    // 2. Client-side fallback via CORS proxy
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
          title: 'India Women 183/5 v Sri Lanka Women 45/1 *',
          team1: { name: 'India Women', score: '183/5', isBatting: false },
          team2: { name: 'Sri Lanka Women', score: '45/1', isBatting: true },
          status: 'LIVE',
          statusText: 'SL-W need 139 runs in 84 balls',
          cricinfoLink: 'https://www.espncricinfo.com',
        },
        {
          id: 'mock-2',
          title: 'India 153/3 * v Afghanistan 156/8',
          team1: { name: 'India', score: '153/3', isBatting: true },
          team2: { name: 'Afghanistan', score: '156/8', isBatting: false },
          status: 'LIVE',
          statusText: 'India need 4 runs to win',
          cricinfoLink: 'https://www.espncricinfo.com',
        },
        {
          id: 'mock-3',
          title: 'Namibia 156/10 v South Africa 157/1 *',
          team1: { name: 'Namibia', score: '156/10', isBatting: false },
          team2: { name: 'South Africa', score: '157/1', isBatting: true },
          status: 'COMPLETED',
          statusText: 'South Africa won by 9 wickets',
          cricinfoLink: 'https://www.espncricinfo.com',
        },
      ]);
    }

    setLastUpdatedTime(new Date());
    setSecondsAgo(0);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [matches.length]);

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

  return (
    <div className="w-full bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500/30 via-red-500/20 to-amber-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Live Match Arena</span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </h3>
              {liveCount > 0 && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500/30 to-red-500/30 text-rose-300 border border-rose-500/40 uppercase tracking-widest shadow-sm">
                  {liveCount} LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Real-time ball-by-ball coverage</span>
              <span>•</span>
              <span className="text-slate-500">Auto-refresh 30s</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({matches.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('LIVE')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'LIVE'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
              <span>Live ({liveCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filter === 'COMPLETED'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Results
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchScores(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-sm"
            title="Refresh Live Scores"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span className="hidden sm:inline">
              {secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`}
            </span>
          </button>

          {/* Scroll Navigation */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MATCHES HORIZONTAL CAROUSEL */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-3 text-slate-400 text-xs">
          <RotateCw className="w-5 h-5 animate-spin text-brand-400" />
          <span>Ingesting real-time live match scorecards...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800 text-xs text-slate-400">
          No matches found under this filter.
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent snap-x"
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
                    ? 'bg-gradient-to-b from-brand-950/60 via-slate-900 to-slate-950 border-brand-500 shadow-2xl shadow-brand-500/20 ring-1 ring-brand-500'
                    : isLive
                    ? 'bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border-rose-500/40 hover:border-rose-500 shadow-xl shadow-rose-500/5'
                    : 'bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 border-slate-800/80 hover:border-slate-700 hover:shadow-xl'
                }`}
              >
                {/* Top Subtle Ambient Glow */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                    isLive
                      ? 'bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80'
                      : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:via-brand-500/50 group-hover:to-transparent'
                  }`}
                />

                {/* Match Card Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {isLive ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-black border border-rose-500/40 tracking-wider shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                        <span>LIVE</span>
                      </span>
                    ) : match.status === 'COMPLETED' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        RESULT
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                        UPCOMING
                      </span>
                    )}

                    <span className="text-slate-400 font-medium truncate max-w-[140px]">
                      {match.statusText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenScorecard) onOpenScorecard(match);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 group-hover:bg-brand-600/30 group-hover:text-brand-300 group-hover:border-brand-500/40 text-slate-300 border border-slate-700/80 font-bold transition text-[10px] cursor-pointer"
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
                        ? 'bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent border-l-4 border-rose-500 shadow-sm'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 ${t1Style}`}
                      >
                        {t1Abbr.slice(0, 4)}
                      </div>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                          {match.team1.name || 'Team 1'}
                        </span>
                        {match.team1.isBatting && (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                            <Flame className="w-3 h-3 animate-bounce" />
                            <span>Currently Batting</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {match.team1.score ? (
                        <div className="font-mono text-base font-black text-white tracking-tight">
                          {match.team1.score}
                          {match.team1.isBatting && (
                            <span className="text-rose-400 ml-0.5 text-sm font-bold">*</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Yet to bat</span>
                      )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div
                    className={`flex items-center justify-between gap-2 p-2 rounded-2xl transition-all ${
                      match.team2.isBatting
                        ? 'bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent border-l-4 border-rose-500 shadow-sm'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 ${t2Style}`}
                      >
                        {t2Abbr.slice(0, 4)}
                      </div>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                          {match.team2.name || 'Team 2'}
                        </span>
                        {match.team2.isBatting && (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                            <Flame className="w-3 h-3 animate-bounce" />
                            <span>Currently Batting</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {match.team2.score ? (
                        <div className="font-mono text-base font-black text-white tracking-tight">
                          {match.team2.score}
                          {match.team2.isBatting && (
                            <span className="text-rose-400 ml-0.5 text-sm font-bold">*</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Yet to bat</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Card Footer */}
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                  <div className="text-slate-400 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-brand-400 transition-colors"></span>
                    <span className="truncate group-hover:text-slate-200 transition-colors">
                      {match.statusText || 'Click to view scorecard'}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 group-hover:bg-brand-500/20 text-slate-300 group-hover:text-brand-300 text-[10px] font-bold transition flex items-center gap-1">
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
