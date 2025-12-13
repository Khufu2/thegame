import React, { useState, useEffect } from 'react';
import { useSports } from '../context/SportsContext';
import { TrendingUp, TrendingDown, Target, BarChart2, Activity, Trophy, AlertTriangle, CheckCircle, XCircle, Clock, Filter, X } from 'lucide-react';

interface PredictionAnalytics {
  timeframe: string;
  filters: {
    league?: string;
    minConfidence?: number;
  };
  overall: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    totalPoints: number;
    averageConfidence: number;
    roi: number;
  } | null;
  confidenceAnalysis: any;
  leaguePerformance: any;
  recentPredictions: any[];
  generatedAt: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useSports();
  const [analytics, setAnalytics] = useState<PredictionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [abExperiments, setAbExperiments] = useState<any[]>([]);
  const [showCreateABTest, setShowCreateABTest] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.email === 'admin@sheena.sports';

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
      fetchABExperiments();
    }
  }, [timeframe, selectedLeague, isAdmin]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/prediction-analytics`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sheena_access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeframe,
            league: selectedLeague || undefined
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolvePredictions = async () => {
    try {
      const response = await fetch(
        `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/resolve-predictions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sheena_access_token')}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Resolved ${result.totalResolved} predictions`);
        fetchAnalytics(); // Refresh data
      } else {
        alert('Failed to resolve predictions');
      }
    } catch (error) {
      console.error('Error resolving predictions:', error);
      alert('Error resolving predictions');
    }
  };

  const fetchABExperiments = async () => {
    try {
      const response = await fetch(
        `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/ab-testing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sheena_access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'LIST' }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAbExperiments(data.result || []);
      }
    } catch (error) {
      console.error('Error fetching A/B experiments:', error);
    }
  };

  const runPromptOptimization = async () => {
    try {
      const response = await fetch(
        `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/optimize-prompts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sheena_access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'OPTIMIZE',
            league: selectedLeague || undefined
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOptimizationResults(data.result);
        alert('Prompt optimization completed! Check results below.');
      } else {
        alert('Failed to run prompt optimization');
      }
    } catch (error) {
      console.error('Error running prompt optimization:', error);
      alert('Error running prompt optimization');
    }
  };

  const createABTest = async (experimentData: any) => {
    try {
      const response = await fetch(
        `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/ab-testing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sheena_access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'CREATE',
            ...experimentData
          }),
        }
      );

      if (response.ok) {
        alert('A/B test created successfully!');
        setShowCreateABTest(false);
        fetchABExperiments();
      } else {
        alert('Failed to create A/B test');
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
      alert('Error creating A/B test');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertTriangle size={64} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You need admin privileges to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Prediction Model Dashboard</h1>
            <p className="text-gray-400">Monitor AI prediction performance and analytics</p>
          </div>

          <div className="flex gap-3">
           <button
             onClick={resolvePredictions}
             className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
           >
             <Target size={16} />
             Resolve Predictions
           </button>
           <button
             onClick={runPromptOptimization}
             className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
           >
             <TrendingUp size={16} />
             Optimize Prompts
           </button>
           <button
             onClick={() => setShowCreateABTest(true)}
             className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
           >
             <Activity size={16} />
             Create A/B Test
           </button>
           <button
             onClick={fetchAnalytics}
             className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
           >
             <BarChart2 size={16} />
             Refresh
           </button>
         </div>
        </div>

        {/* Filters */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="font-medium">Filters:</span>
            </div>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-[#0F172A] border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>

            <input
              type="text"
              placeholder="Filter by league..."
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="bg-[#0F172A] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-8">

            {/* Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Predictions"
                value={analytics.overall?.totalPredictions || 0}
                icon={<Target size={24} />}
                color="blue"
              />
              <MetricCard
                title="Accuracy"
                value={`${analytics.overall?.accuracy || 0}%`}
                icon={<CheckCircle size={24} />}
                color="green"
                trend={analytics.overall?.accuracy > 50 ? 'up' : 'down'}
              />
              <MetricCard
                title="Avg Confidence"
                value={`${analytics.overall?.averageConfidence || 0}%`}
                icon={<Activity size={24} />}
                color="yellow"
              />
              <MetricCard
                title="Total Points"
                value={analytics.overall?.totalPoints || 0}
                icon={<Trophy size={24} />}
                color="purple"
                trend={(analytics.overall?.totalPoints || 0) > 0 ? 'up' : 'down'}
              />
            </div>

            {/* Confidence Analysis */}
            {analytics.confidenceAnalysis && (
              <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart2 size={20} />
                  Confidence Analysis
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(analytics.confidenceAnalysis).map(([range, data]: [string, any]) => (
                    <div key={range} className="bg-[#0F172A] rounded-lg p-4 border border-gray-600">
                      <div className="text-sm font-medium text-gray-400 mb-1">{range}%</div>
                      <div className="text-2xl font-bold mb-1">{data.accuracy}%</div>
                      <div className="text-xs text-gray-500">{data.correct}/{data.total}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* League Performance */}
            {analytics.leaguePerformance && (
              <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy size={20} />
                  League Performance
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 px-4">League</th>
                        <th className="text-center py-2 px-4">Predictions</th>
                        <th className="text-center py-2 px-4">Accuracy</th>
                        <th className="text-center py-2 px-4">Avg Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analytics.leaguePerformance).map(([league, data]: [string, any]) => (
                        <tr key={league} className="border-b border-gray-700">
                          <td className="py-3 px-4 font-medium">{league}</td>
                          <td className="py-3 px-4 text-center">{data.totalPredictions}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-sm ${
                              data.accuracy > 60 ? 'bg-green-600' :
                              data.accuracy > 50 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {data.accuracy}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">{data.averageConfidence}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Predictions */}
            {analytics.recentPredictions && analytics.recentPredictions.length > 0 && (
              <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Recent Predictions
                </h2>
                <div className="space-y-3">
                  {analytics.recentPredictions.slice(0, 10).map((prediction: any) => (
                    <div key={prediction.id} className="flex items-center justify-between bg-[#0F172A] rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          prediction.status === 'RESOLVED'
                            ? prediction.is_correct ? 'bg-green-500' : 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <div className="font-medium">
                            {prediction.home_team} vs {prediction.away_team}
                          </div>
                          <div className="text-sm text-gray-400">
                            {prediction.league} • {prediction.predicted_outcome} • {prediction.confidence}% confidence
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {prediction.status === 'RESOLVED' ? (
                          <div className={`text-sm font-medium ${
                            prediction.is_correct ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {prediction.is_correct ? '✓ Correct' : '✗ Wrong'}
                            {prediction.points_earned !== undefined && (
                              <div className="text-xs">
                                {prediction.points_earned > 0 ? '+' : ''}{prediction.points_earned} pts
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-yellow-400">Pending</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-bold mb-2">No Analytics Data</h2>
            <p className="text-gray-400">Unable to load prediction analytics. Check your connection and try again.</p>
          </div>
        )}

        {/* Prompt Optimization Results */}
        {optimizationResults && (
          <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Prompt Optimization Results
            </h2>
            <div className="space-y-4">
              <div className="bg-[#0F172A] rounded-lg p-4 border border-gray-600">
                <h3 className="font-bold text-green-400 mb-2">Optimization Complete!</h3>
                <p className="text-sm text-gray-300 mb-2">
                  Expected improvement: <span className="text-green-400 font-bold">{optimizationResults.expectedImprovement}</span>
                </p>
                <div className="text-xs text-gray-500">
                  The system has analyzed historical performance and generated an optimized prompt template.
                  New predictions will automatically use the improved prompt.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* A/B Testing Experiments */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity size={20} />
            A/B Testing Experiments
          </h2>
          {abExperiments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity size={40} className="mx-auto mb-2 opacity-50" />
              <p>No A/B tests running</p>
              <p className="text-xs mt-1">Create an experiment to test different prediction strategies</p>
            </div>
          ) : (
            <div className="space-y-3">
              {abExperiments.map((experiment: any) => (
                <div key={experiment.id} className="bg-[#0F172A] rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white">{experiment.experiment_name}</h3>
                      <p className="text-sm text-gray-400">{experiment.experiment_type} • {experiment.status}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      experiment.status === 'ACTIVE' ? 'bg-green-600' :
                      experiment.status === 'COMPLETED' ? 'bg-blue-600' : 'bg-yellow-600'
                    }`}>
                      {experiment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Variant A:</span>
                      <span className="text-white ml-1">{experiment.variant_a_accuracy || 0}% accuracy</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Variant B:</span>
                      <span className="text-white ml-1">{experiment.variant_b_accuracy || 0}% accuracy</span>
                    </div>
                  </div>
                  {experiment.winner && (
                    <div className="mt-2 text-xs">
                      <span className="text-gray-500">Winner:</span>
                      <span className={`ml-1 font-bold ${
                        experiment.winner === 'A' ? 'text-green-400' :
                        experiment.winner === 'B' ? 'text-blue-400' : 'text-yellow-400'
                      }`}>
                        {experiment.winner === 'A' ? 'Variant A' :
                         experiment.winner === 'B' ? 'Variant B' : 'Tie'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Create A/B Test Modal */}
      {showCreateABTest && (
        <CreateABTestModal
          onClose={() => setShowCreateABTest(false)}
          onCreate={createABTest}
        />
      )}
    </div>
  );
};

// Create A/B Test Modal Component
const CreateABTestModal: React.FC<{
  onClose: () => void;
  onCreate: (data: any) => void;
}> = ({ onClose, onCreate }) => {
  const [experimentName, setExperimentName] = useState('');
  const [experimentType, setExperimentType] = useState<'PROMPT' | 'STRATEGY' | 'CONFIDENCE'>('PROMPT');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!experimentName || !variantA || !variantB) {
      alert('Please fill in all fields');
      return;
    }

    onCreate({
      experimentName,
      experimentType,
      variantA: experimentType === 'PROMPT' ? { prompt: variantA } : variantA,
      variantB: experimentType === 'PROMPT' ? { prompt: variantB } : variantB,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1E293B] border border-[#2C2C2C] w-full max-w-[500px] rounded-xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[#2C2C2C] bg-[#121212]">
          <h3 className="font-condensed font-black text-xl uppercase italic">Create A/B Test</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Experiment Name</label>
            <input
              type="text"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              placeholder="e.g., Weather Impact Analysis"
              className="w-full bg-[#0F172A] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Experiment Type</label>
            <select
              value={experimentType}
              onChange={(e) => setExperimentType(e.target.value as any)}
              className="w-full bg-[#0F172A] border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="PROMPT">Prompt Testing</option>
              <option value="STRATEGY">Prediction Strategy</option>
              <option value="CONFIDENCE">Confidence Calibration</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Variant A</label>
            <textarea
              value={variantA}
              onChange={(e) => setVariantA(e.target.value)}
              placeholder={experimentType === 'PROMPT' ? "Enter prompt template for variant A..." : "Enter configuration for variant A..."}
              className="w-full bg-[#0F172A] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 h-24 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Variant B</label>
            <textarea
              value={variantB}
              onChange={(e) => setVariantB(e.target.value)}
              placeholder={experimentType === 'PROMPT' ? "Enter prompt template for variant B..." : "Enter configuration for variant B..."}
              className="w-full bg-[#0F172A] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 h-24 resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
            >
              Create Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper component for metric cards
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  trend?: 'up' | 'down';
}> = ({ title, value, icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600'
  };

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{title}</div>
    </div>
  );
};