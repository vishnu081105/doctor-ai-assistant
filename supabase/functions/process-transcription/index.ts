import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DIARIZATION_PROMPT = `You are a medical transcription specialist with expertise in speaker diarization. Your task is to analyze a medical transcription and identify different speakers (Doctor and Patient).

SPEAKER IDENTIFICATION RULES:
1. Identify speech patterns typical of doctors:
   - Medical terminology and clinical language
   - Questions about symptoms, history, medications
   - Diagnostic statements and recommendations
   - Instructions and prescriptions

2. Identify speech patterns typical of patients:
   - Descriptions of symptoms and complaints
   - Responses to medical questions
   - Personal health history information
   - Questions about treatment or diagnosis

3. Format the output with clear speaker labels:
   - Use "DOCTOR:" prefix for doctor's speech
   - Use "PATIENT:" prefix for patient's speech
   - Start each speaker turn on a new line
   - Preserve the original content exactly, only adding speaker labels

4. When uncertain about speaker:
   - Use context clues from surrounding speech
   - Medical instructions are typically from doctor
   - Symptom descriptions are typically from patient

5. Also correct any medical terminology errors while maintaining speaker labels.

OUTPUT FORMAT:
Return the transcription with speaker labels. Each speaker change should be on a new line.

Example:
DOCTOR: Good morning. What brings you in today?
PATIENT: I've been having severe headaches for the past week.
DOCTOR: Can you describe the pain? Is it constant or intermittent?
PATIENT: It's mostly on the right side and comes and goes.

Do NOT add any explanations or notes - just return the labeled transcription.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { transcription, enableDiarization = true, enhanceTerminology = true } = body;

    if (!transcription || typeof transcription !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid transcription field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (transcription.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Transcription too short to process" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "AI service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing transcription of length: ${transcription.length}, diarization: ${enableDiarization}, enhance: ${enhanceTerminology}`);

    let systemPrompt = "";
    if (enableDiarization && enhanceTerminology) {
      systemPrompt = DIARIZATION_PROMPT;
    } else if (enableDiarization) {
      systemPrompt = "Identify and label speakers as DOCTOR: or PATIENT: in the transcription. Return only the labeled transcription.";
    } else if (enhanceTerminology) {
      systemPrompt = "Fix medical terminology and grammar in this transcription. Return only the corrected text.";
    }

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
            content: `Process this medical transcription:\n\n${transcription}` 
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`AI gateway error: ${response.status} - ${errorText}`);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const processedText = data.choices?.[0]?.message?.content?.trim();

    if (!processedText) {
      return new Response(
        JSON.stringify({ error: "Failed to process transcription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse speakers from the processed text
    const speakers: string[] = [];
    const lines = processedText.split('\n');
    lines.forEach((line: string) => {
      if (line.startsWith('DOCTOR:')) {
        if (!speakers.includes('Doctor')) speakers.push('Doctor');
      } else if (line.startsWith('PATIENT:')) {
        if (!speakers.includes('Patient')) speakers.push('Patient');
      }
    });

    console.log(`Successfully processed transcription. Detected speakers: ${speakers.join(', ')}`);

    return new Response(
      JSON.stringify({ 
        processed: processedText,
        original: transcription,
        speakers: speakers,
        hasDiarization: enableDiarization,
        hasEnhancement: enhanceTerminology,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (e) {
    console.error("process-transcription function error:", e);
    
    const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
    
    return new Response(
      JSON.stringify({ error: `Internal server error: ${errorMessage}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
