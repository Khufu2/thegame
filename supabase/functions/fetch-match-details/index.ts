import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface MatchDetails {
  timeline?: any[];
  stats?: any;
  lineups?: any;
  venueDetails?: any;
  boxScore?: any;
  comments?: any[];
}

async function generateMockMatchDetails(matchId: string): Promise<MatchDetails> {
  // Generate mock data for match details
  const mockTimeline = [
    {
      id: '1',
      minute: '23',
      type: 'GOAL',
      player: 'Erling Haaland',
      description: 'Erling Haaland scores with a powerful header from a corner kick',
      team: 'home'
    },
    {
      id: '2',
      minute: '45+2',
      type: 'CARD',
      player: 'Kevin De Bruyne',
      description: 'Kevin De Bruyne receives a yellow card for dissent',
      team: 'home'
    },
    {
      id: '3',
      minute: '67',
      type: 'SUB',
      player: 'Phil Foden',
      description: 'Phil Foden replaces Kevin De Bruyne',
      team: 'home'
    }
  ];

  const mockStats = {
    shots: { home: 12, away: 8 },
    shotsOnTarget: { home: 6, away: 3 },
    possession: { home: 65, away: 35 },
    passes: { home: 487, away: 312 },
    passesCompleted: { home: 423, away: 267 },
    tackles: { home: 18, away: 22 },
    clearances: { home: 15, away: 12 },
    saves: { home: 2, away: 5 },
    bigChances: { home: 4, away: 2 },
    shotsInsideBox: { home: 8, away: 5 }
  };

  const mockLineups = {
    home: {
      starting: [
        { id: '1', name: 'Ederson', number: 31, position: 'GK' },
        { id: '2', name: 'Kyle Walker', number: 2, position: 'RB' },
        { id: '3', name: 'Ruben Dias', number: 3, position: 'CB' },
        { id: '4', name: 'John Stones', number: 5, position: 'CB' },
        { id: '5', name: 'Phil Foden', number: 47, position: 'LW' },
        { id: '6', name: 'Kevin De Bruyne', number: 17, position: 'CM' },
        { id: '7', name: 'Erling Haaland', number: 9, position: 'ST' }
      ],
      substitutes: [
        { id: '8', name: 'Jack Grealish', number: 10, position: 'LW' },
        { id: '9', name: 'Julian Alvarez', number: 19, position: 'ST' }
      ]
    },
    away: {
      starting: [
        { id: '10', name: 'Alisson', number: 1, position: 'GK' },
        { id: '11', name: 'Trent Alexander-Arnold', number: 66, position: 'RB' },
        { id: '12', name: 'Virgil van Dijk', number: 4, position: 'CB' },
        { id: '13', name: 'Joel Matip', number: 32, position: 'CB' },
        { id: '14', name: 'Mohamed Salah', number: 11, position: 'RW' },
        { id: '15', name: 'Fabinho', number: 3, position: 'CM' },
        { id: '16', name: 'Darwin Nunez', number: 27, position: 'ST' }
      ],
      substitutes: [
        { id: '17', name: 'Diogo Jota', number: 20, position: 'ST' },
        { id: '18', name: 'Luis Diaz', number: 23, position: 'LW' }
      ]
    }
  };

  const mockVenueDetails = {
    name: 'Etihad Stadium',
    city: 'Manchester',
    country: 'England',
    capacity: 55097,
    opened: 2002,
    description: 'The Etihad Stadium is a football stadium in Manchester, England, and the home of Manchester City Football Club. It has been the home of Manchester City since 2003.',
    imageUrl: 'https://via.placeholder.com/800x400'
  };

  const mockBoxScore = {
    headers: ['MIN', 'PTS', 'REB', 'AST', 'FG%', '3P%'],
    home: [
      { name: 'Erling Haaland', stats: [32, 18, 6, 2, '66.7%', '50.0%'] },
      { name: 'Kevin De Bruyne', stats: [28, 12, 4, 8, '45.5%', '40.0%'] },
      { name: 'Phil Foden', stats: [25, 15, 3, 5, '55.6%', '33.3%'] }
    ],
    away: [
      { name: 'Mohamed Salah', stats: [30, 14, 5, 3, '50.0%', '25.0%'] },
      { name: 'Darwin Nunez', stats: [27, 10, 4, 2, '42.9%', '0.0%'] },
      { name: 'Trent Alexander-Arnold', stats: [29, 8, 6, 4, '37.5%', '33.3%'] }
    ]
  };

  const mockComments = [
    {
      id: '1',
      userName: 'FootyFan2024',
      userAvatar: 'https://via.placeholder.com/32x32',
      text: 'What a match! Haaland is on fire 🔥',
      timestamp: '2 hours ago',
      teamSupport: 'HOME',
      isPro: false,
      likes: 12
    },
    {
      id: '2',
      userName: 'BetMaster',
      userAvatar: 'https://via.placeholder.com/32x32',
      text: 'City dominating possession. Expected result.',
      timestamp: '1 hour ago',
      teamSupport: null,
      isPro: true,
      likes: 8
    }
  ];

  return {
    timeline: mockTimeline,
    stats: mockStats,
    lineups: mockLineups,
    venueDetails: mockVenueDetails,
    boxScore: mockBoxScore,
    comments: mockComments
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const matchId = url.searchParams.get("matchId");

    if (!matchId) {
      return new Response(
        JSON.stringify({ error: "matchId parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    console.log(`Fetching details for match: ${matchId}`);

    // For now, generate mock data. In production, this would fetch from APIs
    const matchDetails = await generateMockMatchDetails(matchId);

    return new Response(
      JSON.stringify(matchDetails),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-match-details:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});