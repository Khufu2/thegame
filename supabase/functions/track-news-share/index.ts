// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface TrackShareRequest {
  feedId: string;
  shareMethod?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: TrackShareRequest = await req.json();
    const { feedId, shareMethod = 'web' } = body;

    if (!feedId) {
      return new Response(JSON.stringify({ error: "feedId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get user from JWT if available
    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.warn('Could not extract user from token:', error);
      }
    }

    // Track the share
    const { error } = await supabase
      .from("news_shares")
      .insert({
        feed_id: feedId,
        user_id: userId,
        share_method: shareMethod,
      });

    if (error) {
      console.error("Error tracking share:", error);
      return new Response(JSON.stringify({ error: "Failed to track share" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in track-news-share:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});