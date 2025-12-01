// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_DEFAULT_TO = Deno.env.get("WHATSAPP_DEFAULT_TO"); // 15551234567

interface BroadcastRequest {
  message: string;
  to?: string | string[];
  preview_url?: boolean;
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  error?: { message: string; code: number };
}

async function sendWhatsAppMessage(
  to: string,
  message: string,
  previewUrl = false,
): Promise<{ success: boolean; response?: WhatsAppResponse; error?: string }> {
  try {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error("WhatsApp Business API credentials not configured");
    }

    const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: message,
        preview_url: previewUrl,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as WhatsAppResponse;

    if (!response.ok) {
      const errorMessage = data?.error?.message || `WhatsApp API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return { success: true, response: data };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error.message || String(error) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const body: BroadcastRequest = await req.json();
    const { message, to, preview_url = false } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing required field: message" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const recipients = Array.isArray(to)
      ? to
      : to
        ? [to]
        : WHATSAPP_DEFAULT_TO
          ? [WHATSAPP_DEFAULT_TO]
          : [];

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipient provided and WHATSAPP_DEFAULT_TO not set" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const results = [];
    for (const recipient of recipients) {
      console.log(`📱 Broadcasting to WhatsApp ${recipient}...`);
      const result = await sendWhatsAppMessage(recipient, message, preview_url);
      results.push({ to: recipient, ...result });
    }

    return new Response(
      JSON.stringify({
        status: results.every((r) => r.success) ? "success" : "partial",
        channel: "whatsapp",
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in whatsapp-broadcast:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
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


