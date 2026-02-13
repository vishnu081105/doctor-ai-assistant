// @ts-ignore: Deno module
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const reportPrompts: Record<string, string> = {
  general: `You are an expert medical transcription assistant at MediVoice Hospital. Convert the following medical dictation into a General Clinical Note.

ACCURACY RULES (CRITICAL):
- ONLY include information that is EXPLICITLY stated in the dictation
- DO NOT infer, assume, or fabricate any clinical details
- DO NOT add generic medical advice or standard recommendations not mentioned
- If a section has no relevant information from the dictation, write "Not mentioned in dictation"
- Use the EXACT medical terms spoken by the doctor - do not substitute with synonyms
- Preserve all numerical values, dosages, measurements, and lab values exactly as stated
- If the doctor mentions a drug name, use that exact name (brand or generic as spoken)
- Do not add differential diagnoses unless the doctor explicitly mentions them

FORMATTING RULES:
- All section headings MUST be plain text only
- DO NOT use asterisks (*), markdown (**), or hash symbols (#)
- Content under headings may use simple dashes (-) for bullet points
- Maintain professional, ADA-compliant clinical language

Include these sections with PLAIN TEXT headings:

MEDIVOICE HOSPITAL

GENERAL CLINICAL NOTE

PATIENT INFORMATION
- Include Patient ID if provided
- Include relevant demographic information mentioned

ATTENDING PHYSICIAN

CHIEF COMPLAINT
- Exact presenting complaint as stated

HISTORY OF PRESENT ILLNESS
- Only details explicitly dictated
- Include duration, onset, severity as mentioned

PAST MEDICAL HISTORY
- Only conditions explicitly mentioned

PHYSICAL EXAMINATION
- Only findings explicitly stated by the physician

INVESTIGATIONS
- List only tests and results explicitly mentioned
- Include exact values as stated

DIAGNOSIS
- Only diagnoses explicitly stated by the physician

PLAN / RECOMMENDATIONS
- Only treatments, medications, and follow-up explicitly mentioned
- Include exact dosages and durations as stated

Format cleanly with precise medical terminology from the dictation. Never fabricate or generalize.`,

  soap: `You are an expert medical transcription assistant at MediVoice Hospital. Convert the following medical dictation into a SOAP Note.

ACCURACY RULES (CRITICAL):
- ONLY include information that is EXPLICITLY stated in the dictation
- DO NOT infer, assume, or fabricate any clinical details
- DO NOT add generic medical advice or standard recommendations not mentioned
- If a section has no relevant information from the dictation, write "Not mentioned in dictation"
- Use the EXACT medical terms spoken by the doctor
- Preserve all numerical values, dosages, measurements, and lab values exactly as stated
- Do not add differential diagnoses unless explicitly mentioned

FORMATTING RULES:
- All section headings MUST be plain text only
- DO NOT use asterisks (*), markdown (**), or hash symbols (#)
- Content under headings may use simple dashes (-) for bullet points

Structure with PLAIN TEXT headings:

MEDIVOICE HOSPITAL

SOAP NOTE

PATIENT INFORMATION
- Patient ID (if mentioned)
- Demographics (if mentioned)

ATTENDING PHYSICIAN

S (Subjective)
- Chief complaint exactly as stated
- History of present illness - only dictated details
- Past medical/surgical history if mentioned
- Family/social history if mentioned
- Review of systems - only systems explicitly reviewed

O (Objective)
- Vital signs with exact values as stated
- Physical examination findings exactly as described
- Lab results with exact values if mentioned
- Imaging findings if mentioned

A (Assessment)
- Only diagnoses explicitly stated
- Clinical reasoning only if explicitly dictated

P (Plan)
- Exact medications with dosages as stated
- Specific follow-up instructions as mentioned
- Referrals only if explicitly mentioned
- Patient education only if explicitly mentioned

Be precise. Only document what was dictated. Never generalize.`,

  diagnostic: `You are an expert medical transcription assistant at MediVoice Hospital. Convert the following medical dictation into a Diagnostic / Pathology Report.

ACCURACY RULES (CRITICAL):
- ONLY include information that is EXPLICITLY stated in the dictation
- DO NOT infer, assume, or fabricate any clinical or pathological details
- If a section has no relevant information from the dictation, write "Not mentioned in dictation"
- Use the EXACT medical/pathological terms spoken
- Preserve all measurements, staining results, and grading exactly as stated
- Do not add staging or prognostic information unless explicitly mentioned

FORMATTING RULES:
- All section headings MUST be plain text only
- DO NOT use asterisks (*), markdown (**), or hash symbols (#)
- Content under headings may use simple dashes (-) for bullet points

Structure with PLAIN TEXT headings:

MEDIVOICE HOSPITAL

DIAGNOSTIC REPORT

PATIENT INFORMATION
- Patient ID (if mentioned)
- Age, Gender (if mentioned)
- Date of specimen collection (if mentioned)

ATTENDING PHYSICIAN

SPECIMEN DETAILS
- Type of specimen as stated
- Site of collection as stated
- Laterality if mentioned

CLINICAL HISTORY
- Only history explicitly provided in dictation

GROSS EXAMINATION
- Only findings explicitly described

MICROSCOPIC EXAMINATION
- Only findings explicitly described
- Special stains or immunohistochemistry only if mentioned

TESTS AND RESULTS
- Only tests explicitly mentioned with exact values
- Reference ranges only if stated by physician

DIAGNOSIS
- Only diagnoses explicitly stated
- Staging/grading only if explicitly mentioned

RECOMMENDATIONS
- Only recommendations explicitly stated by physician

Document only what was dictated. Use exact medical terminology. Never fabricate findings.`,
};

// Function to clean any remaining asterisks from the response
function cleanAsterisks(text: string): string {
  return text.replace(/\*+/g, '').replace(/\*\*/g, '').replace(/\#+/g, '');
}

// Function to validate report type
function isValidReportType(type: string): type is keyof typeof reportPrompts {
  return type in reportPrompts;
}

// Function to create a readable stream transformer for cleaning asterisks
function createStreamTransformer() {
  return new TransformStream({
    transform(chunk, controller) {
      try {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
              continue;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.choices?.[0]?.delta?.content) {
                // Clean asterisks from the content
                parsed.choices[0].delta.content = cleanAsterisks(parsed.choices[0].delta.content);
              }
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(parsed)}\n\n`));
            } catch (parseError) {
              // If JSON parsing fails, pass through the original line
              console.warn('Failed to parse JSON in stream:', parseError);
              controller.enqueue(new TextEncoder().encode(`${line}\n`));
            }
          } else if (line.trim()) {
            // Pass through non-data lines (like comments)
            controller.enqueue(new TextEncoder().encode(`${line}\n`));
          }
        }
      } catch (error) {
        console.error('Stream transformation error:', error);
        // On error, pass through the original chunk
        controller.enqueue(chunk);
      }
    }
  });
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body = await req.json().catch(() => null);
    
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { transcription, reportType } = body;

    // Validate required fields
    if (!transcription || typeof transcription !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid transcription field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!reportType || typeof reportType !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid reportType field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate report type
    if (!isValidReportType(reportType)) {
      return new Response(
        JSON.stringify({ error: `Invalid reportType. Supported types: ${Object.keys(reportPrompts).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for API key
    // @ts-ignore: Deno global
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "AI service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = reportPrompts[reportType];

    console.log(`Generating ${reportType} report for transcription length: ${transcription.length}`);

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
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
              content: `Convert this medical dictation into a ${reportType} report. CRITICAL: Only include information EXPLICITLY present in the dictation. Do NOT add any details, recommendations, or diagnoses not mentioned. Use exact medical terms as spoken. NO asterisks, NO markdown, plain text headings only:\n\n${transcription}`
            },
          ],
          stream: true,
          temperature: 0.1, // Lower temperature for more consistent medical reports
          max_tokens: 4000, // Ensure sufficient length for comprehensive reports
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
          JSON.stringify({ error: "AI service quota exceeded. Please check your account limits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 413) {
        return new Response(
          JSON.stringify({ error: "Transcription too long. Please shorten your input." }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status >= 500) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform the stream to clean asterisks
    if (!response.body) {
      return new Response(
        JSON.stringify({ error: "No response stream from AI service" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const transformedStream = response.body.pipeThrough(createStreamTransformer());

      return new Response(transformedStream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } catch (streamError) {
      console.error("Stream processing error:", streamError);
      return new Response(
        JSON.stringify({ error: "Failed to process AI response stream" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (e) {
    console.error("generate-report function error:", e);

    // Handle specific error types
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: "Request timeout. Please try again." }),
          { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (e.message.includes('fetch')) {
        return new Response(
          JSON.stringify({ error: "Network error. Please check your connection and try again." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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
