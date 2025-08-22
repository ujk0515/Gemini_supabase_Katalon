import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { model, contents } = await req.json();

    if (!model || !contents) {
      throw new Error("Missing model or contents in the request body");
    }

    const googleAiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;

    const googleAiResponse = await fetch(googleAiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents }),
    });

    if (!googleAiResponse.ok) {
      const errorBody = await googleAiResponse.text();
      console.error("Google AI API error:", errorBody);
      throw new Error(`Google AI API error: ${googleAiResponse.status} ${googleAiResponse.statusText}`);
    }

    const responseData = await googleAiResponse.json();

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Tye": "application/json" },
      status: 400,
    });
  }
});