import React, { useState, useMemo } from 'react';
import { X, Plus, Search, Filter, Clock, TrendingUp, Target, Zap } from 'lucide-react';
import { Match, BetSlipItem } from '../types';

interface ManualBetBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  onAddItem: (item: BetSlipItem) => void;
  existingItems: BetSlipItem[];
}

interface BetMarket {
  id: string;
  label: string;
  type: 'MATCH_WINNER' | 'BTTS' | 'OVER_UNDER' | 'HANDICAP';
  selection: string;
  odds: number;
  description: string;
}

export const ManualBetBuilderModal: React.FC<ManualBetBuilderModalProps> = ({
  isOpen,
  onClose,
  matches,
  onAddItem,
  existingItems
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');

  const leagues = useMemo(() => {
    const uniqueLeagues = [...new Set(matches.map(m => m.league))];
    return ['ALL', ...uniqueLeagues];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const matchesSearch = match.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           match.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           match.league.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLeague = selectedLeague === 'ALL' || match.league === selectedLeague;
      return matchesSearch && matchesLeague && match.status === 'SCHEDULED';
    });
  }, [matches, searchTerm, selectedLeague]);

  const generateMarkets = (match: Match): BetMarket[] => {
    const markets: BetMarket[] = [];

    // Match Winner
    if (match.prediction?.odds) {
      markets.push({
        id: `mw_home_${match.id}`,
        label: 'Match Winner',
        type: 'MATCH_WINNER',
        selection: match.homeTeam.name,
        odds: match.prediction.odds.home,
        description: `${match.homeTeam.name} to win`
      });
      markets.push({
        id: `mw_draw_${match.id}`,
        label: 'Match Winner',
        type: 'MATCH_WINNER',
        selection: 'Draw',
        odds: match.prediction.odds.draw,
        description: 'Match ends in draw'
      });
      markets.push({
        id: `mw_away_${match.id}`,
        label: 'Match Winner',
        type: 'MATCH_WINNER',
        selection: match.awayTeam.name,
        odds: match.prediction.odds.away,
        description: `${match.awayTeam.name} to win`
      });
    }

    // BTTS
    markets.push({
      id: `btts_yes_${match.id}`,
      label: 'Both Teams To Score',
      type: 'BTTS',
      selection: 'Yes',
      odds: 2.10,
      description: 'Both teams score at least 1 goal'
    });
    markets.push({
      id: `btts_no_${match.id}`,
      label: 'Both Teams To Score',
      type: 'BTTS',
      selection: 'No',
      odds: 1.75,
      description: 'At least one team doesn\'t score'
    });

    // Over/Under
    markets.push({
      id: `ou_over_${match.id}`,
      label: 'Over/Under 2.5',
      type: 'OVER_UNDER',
      selection: 'Over 2.5',
      odds: 1.90,
      description: 'Total goals over 2.5'
    });
    markets.push({
      id: `ou_under_${match.id}`,
      label: 'Over/Under 2.5',
      type: 'OVER_UNDER',
      selection: 'Under 2.5',
      odds: 1.85,
      description: 'Total goals under 2.5'
    });

    return markets;
  };

  const handleAddBet = (market: BetMarket, match: Match) => {
    const betItem: BetSlipItem = {
      id: `manual_${market.id}_${Date.now()}`,
      matchId: match.id,
      matchUp: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      selection: market.selection,
      odds: market.odds,
      outcome: market.type === 'MATCH_WINNER' ?
        (market.selection === match.homeTeam.name ? 'HOME' :
         market.selection === match.awayTeam.name ? 'AWAY' : 'DRAW') : 'HOME',
      timestamp: Date.now(),
      market: market.label,
      type: market.type
    };

    onAddItem(betItem);
  };

  const isAlreadyAdded = (marketId: string) => {
    return existingItems.some(item => item.id.includes(marketId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1E1E1E] w-full max-w-4xl rounded-2xl border border-[#2C2C2C] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-[#00FFB2]" />
            <h3 className="font-condensed font-black text-lg uppercase text-white">Build Your Parlay</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-[#2C2C2C] bg-[#0A0A0A]">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams or leagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1E1E1E] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:border-[#00FFB2] outline-none"
              />
            </div>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="px-3 py-2 bg-[#1E1E1E] border border-[#333] rounded-lg text-white focus:border-[#00FFB2] outline-none"
            >
              {leagues.map(league => (
                <option key={league} value={league}>{league}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selectedMatch ? (
            <div className="p-4">
              <h4 className="font-condensed font-bold text-white mb-4 uppercase">Select a Match</h4>
              <div className="grid gap-3">
                {filteredMatches.slice(0, 20).map(match => (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-4 cursor-pointer hover:border-[#00FFB2] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">{match.league}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(match.time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{match.homeTeam.name}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="font-bold text-white">{match.awayTeam.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Predicted</div>
                        <div className="font-mono font-bold text-[#00FFB2]">
                          {match.prediction?.outcome === 'HOME' ? match.homeTeam.name :
                           match.prediction?.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ← Back to matches
                </button>
                <div className="flex-1">
                  <h4 className="font-condensed font-bold text-white uppercase">
                    {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
                  </h4>
                  <span className="text-xs text-gray-400">{selectedMatch.league}</span>
                </div>
              </div>

              <div className="grid gap-4">
                {generateMarkets(selectedMatch).map(market => (
                  <div key={market.id} className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-400 uppercase">{market.label}</span>
                      <span className="font-mono font-bold text-[#00FFB2]">{market.odds}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{market.selection}</span>
                        <p className="text-xs text-gray-400 mt-1">{market.description}</p>
                      </div>
                      <button
                        onClick={() => handleAddBet(market, selectedMatch)}
                        disabled={isAlreadyAdded(market.id)}
                        className={`px-4 py-2 rounded-lg font-bold uppercase text-sm transition-colors ${
                          isAlreadyAdded(market.id)
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-[#00FFB2] text-black hover:bg-[#00FFB2]/80'
                        }`}
                      >
                        {isAlreadyAdded(market.id) ? 'Added' : 'Add to Slip'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};