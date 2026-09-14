import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RotateCw,
  Search,
  Filter,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Flame,
  Radio,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { CricketScorecardModal } from '../components/cricket/CricketScorecardModal';
import {
  CricketMatch,
  CricketTeamScore,
  getTeamBadgeStyle,
  getTeamAbbr,
} from '../components/cricket/CricketScoresBar';

export const CricketLivePage: React.FC = () => {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<'ALL' | 'T20' | 'ODI' | 'TEST'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scorecardMatch, setScorecardMatch] = useState<CricketMatch | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  // Fetch matches from CricketData.org via backend
  const fetchMatches = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);

    try {
      const res = await api.get('/cricket/matches', {
        params: { type: 'all' },
        timeout: 9000,
      });

      if (res.data && Array.isArray(res.data.matches) && res.data.matches.length > 0) {
        setMatches(res.data.matches);
        setLastUpdated(new Date());
        setSecondsAgo(0);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
    } catch (err) {
      console.warn('Backend cricket endpoint error, trying live-scores fallback:', err);
      try {
        const res2 = await api.get('/cricket/live-scores', { timeout: 7000 });
        if (res2.data && Array.isArray(res2.data.matches) && res2.data.matches.length > 0) {
          setMatches(res2.data.matches);
          setLastUpdated(new Date());
          setSecondsAgo(0);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      } catch (err2) {
        console.error('All cricket match endpoints failed:', err2);
      }
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  // Poll for updates every 30 seconds
  useEffect(() => {
    fetchMatches();
    const pollInterval = setInterval(() => {
      fetchMatches();
    }, 30000);

    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timer);
    };
  }, [fetchMatches]);

  // Statistics counts
  const liveCount = useMemo(() => matches.filter((m) => m.status === 'LIVE').length, [matches]);
  const upcomingCount = useMemo(() => matches.filter((m) => m.status === 'UPCOMING').length, [matches]);
  const completedCount = useMemo(() => matches.filter((m) => m.status === 'COMPLETED').length, [matches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Category filter
      if (selectedCategory !== 'ALL' && m.status !== selectedCategory) {
        return false;
      }

      // Format filter
      if (selectedFormat !== 'ALL') {
        const fmt = (m.matchType || '').toLowerCase();
        if (selectedFormat === 'T20' && !fmt.includes('t20')) return false;
        if (selectedFormat === 'ODI' && !fmt.includes('odi')) return false;
        if (selectedFormat === 'TEST' && !fmt.includes('test')) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = m.title.toLowerCase().includes(q);
        const inTeam1 = m.team1.name.toLowerCase().includes(q);
        const inTeam2 = m.team2.name.toLowerCase().includes(q);
        const inVenue = (m.venue || '').toLowerCase().includes(q);
        const inStatus = m.statusText.toLowerCase().includes(q);
        return inTitle || inTeam1 || inTeam2 || inVenue || inStatus;
      }

      return true;
    });
  }, [matches, selectedCategory, selectedFormat, searchQuery]);

  // Helper to format match kick-off date / time
  const formatMatchTime = (dateTimeGMT?: string) => {
    if (!dateTimeGMT) return '';
    try {
      const d = new Date(dateTimeGMT);
      if (isNaN(d.getTime())) return dateTimeGMT;
      return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeGMT;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* WORLD-CLASS BROADCAST HERO BANNER */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden p-6 sm:p-8">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-brand-500 to-emerald-500 opacity-80" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black uppercase tracking-wider shadow-sm shadow-rose-500/20">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-rose-500 -ml-3.5" />
                <span>CRICKET ARENA</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>CricketData.org (CricAPI)</span>
              </span>

              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Auto-refresh 30s</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Cricket Match Center</span>
              <Flame className="w-7 h-7 text-amber-400 animate-bounce" />
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore official live scores, upcoming international fixtures, and recent match scorecards. Click on any match card to open the complete ball-by-ball scorecard inside this website.
            </p>
          </div>

          {/* Quick Stats Summary & Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800 text-center">
              <div className="px-3 py-1.5">
                <div className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  <span>Live</span>
                </div>
                <div className="text-lg font-black text-rose-400">{liveCount}</div>
              </div>

              <div className="px-3 py-1.5 border-x border-slate-800">
                <div className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  <span>Upcoming</span>
                </div>
                <div className="text-lg font-black text-blue-400">{upcomingCount}</div>
              </div>

              <div className="px-3 py-1.5">
                <div className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-emerald-400" />
                  <span>Results</span>
                </div>
                <div className="text-lg font-black text-emerald-400">{completedCount}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchMatches(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer shadow-lg disabled:opacity-50 shrink-0"
              title="Refresh cricket matches data"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
              <span>{secondsAgo < 5 ? 'Just updated' : `${secondsAgo}s ago`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-3xl border border-slate-800/80 backdrop-blur-xl">
        {/* Category Filter Segments */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Matches ({matches.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('LIVE')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'LIVE'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>Live Now ({liveCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('UPCOMING')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'UPCOMING'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming Fixtures ({upcomingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('COMPLETED')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'COMPLETED'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Completed Results ({completedCount})</span>
          </button>
        </div>

        {/* Format Filter & Search */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Format pills */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-[11px] font-bold">
            {(['ALL', 'T20', 'ODI', 'TEST'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                  selectedFormat === fmt
                    ? 'bg-slate-800 text-brand-300 border border-brand-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt === 'ALL' ? 'All Formats' : fmt}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team, venue, series..."
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* MATCH CARDS ARENA GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <RotateCw className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-sm font-bold text-slate-300">Fetching live cricket scores & fixtures from CricketData.org...</p>
          <p className="text-xs text-slate-500">Live ball-by-ball scorecards, schedules, and tournament tables</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/60 rounded-3xl border border-slate-800/80 space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No matches found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No matches matching "${searchQuery}". Try searching for another team or clear filters.`
              : 'There are currently no matches available in this selected filter.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-slate-800 text-brand-300 text-xs font-bold border border-slate-700 hover:bg-slate-750 transition cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.map((match) => {
            const isLive = match.status === 'LIVE';
            const isCompleted = match.status === 'COMPLETED';
            const isUpcoming = match.status === 'UPCOMING';

            const t1Abbr = match.team1.shortName || getTeamAbbr(match.team1.name);
            const t2Abbr = match.team2.shortName || getTeamAbbr(match.team2.name);
            const t1Style = getTeamBadgeStyle(match.team1.name);
            const t2Style = getTeamBadgeStyle(match.team2.name);

            return (
              <div
                key={match.id}
                onClick={() => setScorecardMatch(match)}
                className={`group relative rounded-3xl p-5 transition-all duration-300 cursor-pointer border flex flex-col justify-between overflow-hidden ${
                  isLive
                    ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-rose-500/40 hover:border-rose-500 hover:shadow-2xl hover:shadow-rose-500/10'
                    : isCompleted
                    ? 'bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 border-slate-800/90 hover:border-slate-700 hover:shadow-xl'
                    : 'bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 border-blue-500/30 hover:border-blue-500/60 hover:shadow-xl'
                }`}
              >
                {/* Subtle Top Accent Glow */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                    isLive
                      ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-500'
                      : isCompleted
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500'
                      : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500'
                  }`}
                />

                {/* Card Top: Match Type, Status Badge, Venue */}
                <div className="space-y-2 pb-3.5 border-b border-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Format Badge */}
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-brand-300 font-mono text-[10px] font-black uppercase tracking-wider border border-slate-700">
                        {match.matchType?.toUpperCase() || 'MATCH'}
                      </span>

                      {/* Status Badge */}
                      {isLive ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-black border border-rose-500/40 text-[10px] tracking-wider shadow-sm animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                          <span>LIVE NOW</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-black border border-emerald-500/30 text-[10px] tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FINAL RESULT</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-black border border-blue-500/30 text-[10px] tracking-wider">
                          <Clock className="w-3 h-3" />
                          <span>UPCOMING</span>
                        </span>
                      )}
                    </div>

                    {/* Scheduled time or date */}
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatMatchTime(match.dateTimeGMT)}
                    </span>
                  </div>

                  {/* Series / Match Title */}
                  <h3 className="text-xs font-bold text-slate-300 truncate" title={match.title}>
                    {match.title}
                  </h3>

                  {match.venue && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{match.venue}</span>
                    </p>
                  )}
                </div>

                {/* Middle: Teams & Scores */}
                <div className="py-4 space-y-3">
                  {/* Team 1 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${t1Style}`}
                      >
                        {t1Abbr.slice(0, 4)}
                      </div>
                      <span
                        className={`text-sm font-black truncate ${
                          match.team1.isBatting ? 'text-amber-300' : 'text-white'
                        }`}
                        title={match.team1.name}
                      >
                        {match.team1.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      {match.team1.score ? (
                        <span className="text-sm sm:text-base font-black text-white flex items-center gap-1">
                          <span>{match.team1.score}</span>
                          {match.team1.isBatting && (
                            <span className="text-rose-400 font-black text-xs animate-ping">*</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          {isUpcoming ? 'Scheduled' : 'Yet to bat'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${t2Style}`}
                      >
                        {t2Abbr.slice(0, 4)}
                      </div>
                      <span
                        className={`text-sm font-black truncate ${
                          match.team2.isBatting ? 'text-amber-300' : 'text-white'
                        }`}
                        title={match.team2.name}
                      >
                        {match.team2.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      {match.team2.score ? (
                        <span className="text-sm sm:text-base font-black text-white flex items-center gap-1">
                          <span>{match.team2.score}</span>
                          {match.team2.isBatting && (
                            <span className="text-rose-400 font-black text-xs animate-ping">*</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          {isUpcoming ? 'Scheduled' : 'Yet to bat'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Text Banner */}
                <div className="mt-1 pt-3 border-t border-slate-800/80 space-y-3">
                  <div
                    className={`px-3 py-2 rounded-xl text-xs font-bold leading-snug flex items-center gap-2 ${
                      isLive
                        ? 'bg-rose-500/15 text-rose-200 border border-rose-500/30'
                        : isCompleted
                        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-200 border border-blue-500/30'
                    }`}
                  >
                    <span className="truncate">{match.statusText}</span>
                  </div>

                  {/* Action Button: View Full Scorecard */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScorecardMatch(match);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/90 group-hover:bg-brand-600 text-slate-200 group-hover:text-white border border-slate-700 group-hover:border-brand-500 text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-sm active:scale-98"
                  >
                    <span>{isUpcoming ? 'Match Preview & Details' : 'View Full Scorecard'}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL IN-WEBSITE SCORECARD MODAL */}
      <CricketScorecardModal
        match={scorecardMatch}
        onClose={() => setScorecardMatch(null)}
      />
    </div>
  );
};
export default CricketLivePage;
