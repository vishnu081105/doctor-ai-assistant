import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const reportPrompts: Record<string, string> = {
  general: `You are an expert medical transcription assistant. Convert the following medical dictation into a well-structured General Clinical Note. 

Include the following sections as appropriate:
- Chief Complaint
- History of Present Illness
- Review of Systems
- Physical Examination
- Assessment
- Plan

Format the output cleanly with proper medical terminology. Be concise but thorough.`,

  soap: `You are an expert medical transcription assistant. Convert the following medical dictation into a properly formatted SOAP Note.

Structure the output as:
**S (Subjective):** Patient's symptoms, complaints, and history as reported
**O (Objective):** Physical examination findings, vital signs, test results
**A (Assessment):** Diagnosis or differential diagnoses
**P (Plan):** Treatment plan, medications, follow-up instructions

Be precise and use standard medical terminology.`,

  diagnostic: `You are an expert medical transcription assistant. Convert the following medical dictation into a focused Diagnostic Report.

Include:
- Clinical Indication
- Findings (organized by system/region)
- Impression/Conclusion
- Recommendations (if any)

Focus on diagnostic findings and conclusions. Use precise medical terminology.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription, reportType } = await req.json();

    if (!transcription || !reportType) {
      return new Response(
        JSON.stringify({ error: "Missing transcription or reportType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = reportPrompts[reportType] || reportPrompts.general;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Please convert this medical dictation into a ${reportType} report:\n\n${transcription}` 
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
