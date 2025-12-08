// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface BetRequest {
  userId: string;
  matchId: string;
  selection: string; // 'HOME' | 'DRAW' | 'AWAY'
  odds: number;
  stake: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, matchId, selection, odds, stake }: BetRequest = await req.json();

    // Validate input
    if (!userId || !matchId || !selection || !odds || !stake) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stake <= 0) {
      return new Response(
        JSON.stringify({ error: "Stake must be greater than 0" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentBalance = profile.balance || 0;
    if (currentBalance < stake) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance", currentBalance }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if match exists and is still open for betting
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('status, kickoff_time')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return new Response(
        JSON.stringify({ error: "Match not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (match.status !== 'scheduled' && match.status !== 'SCHEDULED') {
      return new Response(
        JSON.stringify({ error: "Match is no longer open for betting" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate potential payout
    const potentialPayout = stake * odds;

    // Create the bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: userId,
        match_id: matchId,
        selection: selection,
        odds: odds,
        stake: stake,
        potential_payout: potentialPayout,
        status: 'pending',
      })
      .select()
      .single();

    if (betError) {
      console.error("Error creating bet:", betError);
      return new Response(
        JSON.stringify({ error: "Failed to place bet" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct stake from user balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: currentBalance - stake })
      .eq('id', userId);

    if (updateError) {
      // Rollback bet if balance update fails
      await supabase.from('bets').delete().eq('id', bet.id);
      return new Response(
        JSON.stringify({ error: "Failed to update balance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user stats
    await supabase
      .from('profiles')
      .update({
        stats: supabase.rpc('jsonb_set', {
          target: 'stats',
          path: '{betsPlaced}',
          value: (profile.stats?.betsPlaced || 0) + 1
        })
      })
      .eq('id', userId)
      .catch(() => {}); // Non-critical

    console.log(`Bet placed: ${bet.id} for user ${userId} on match ${matchId}`);

    return new Response(
      JSON.stringify({
        success: true,
        bet: {
          id: bet.id,
          matchId: bet.match_id,
          selection: bet.selection,
          odds: bet.odds,
          stake: bet.stake,
          potentialPayout: bet.potential_payout,
          status: bet.status,
        },
        newBalance: currentBalance - stake,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("place-bet error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
