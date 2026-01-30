import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const reportPrompts: Record<string, string> = {
  general: `You are an expert medical transcription assistant at MediVoice Hospital. Convert the following medical dictation into a comprehensive, detailed General Clinical Note.

CRITICAL FORMATTING RULES:
- All section headings MUST be plain text only
- DO NOT use asterisks (*) anywhere in the output
- DO NOT use markdown formatting like ** or * or # 
- DO NOT surround headings with any symbols
- DO NOT use bold, italic, or any formatting on heading lines
- Content under headings may use simple dashes (-) for bullet points
- If information is missing, state "Information not provided"
- Maintain professional, ADA-compliant clinical language
- Provide DETAILED and COMPREHENSIVE information in each section
- Expand on clinical findings with thorough explanations

Include these sections with PLAIN TEXT headings:

MEDIVOICE HOSPITAL
SONOMAWORKS LEAP (Learning Enhancement & Achievement Program)

COMPREHENSIVE DIAGNOSTIC REPORT

PATIENT INFORMATION
- Include Patient ID if provided
- Include relevant demographic information

ATTENDING PHYSICIAN

BACKGROUND & MANIFESTATIONS
- Provide detailed patient history
- Include presenting symptoms with duration and severity
- Document relevant medical history

TESTS ADMINISTERED AND RESULTS OBTAINED
- List all tests with detailed results
- Include normal ranges where applicable
- Provide interpretation of findings

OBSERVATIONS
- Document clinical observations in detail
- Include physical examination findings
- Note any abnormalities observed

SUMMARY / DIAGNOSIS
- Provide comprehensive diagnostic summary
- Include differential diagnoses if applicable
- Explain clinical reasoning

RECOMMENDATION
- Detailed treatment plan
- Medication with dosages and duration
- Follow-up schedule
- Patient education points

Format the output cleanly with proper medical terminology. Be comprehensive and thorough. Never use asterisks.`,

  soap: `You are an expert medical transcription assistant at MediVoice Hospital. Convert the following medical dictation into a comprehensive SOAP Note.

CRITICAL FORMATTING RULES:
- All section headings MUST be plain text only
- DO NOT use asterisks (*) anywhere in the output
- DO NOT use markdown formatting like ** or * or #
- DO NOT surround headings with any symbols
- DO NOT use bold, italic, or any formatting on heading lines
- Content under headings may use simple dashes (-) for bullet points
- If information is missing, state "Information not provided"
- Maintain professional, ADA-compliant clinical language
- Provide DETAILED and COMPREHENSIVE information in each section

Structure the output with PLAIN TEXT headings as:

MEDIVOICE HOSPITAL
SONOMAWORKS LEAP (Learning Enhancement & Achievement Program)

COMPREHENSIVE DIAGNOSTIC REPORT

PATIENT INFORMATION
- Patient ID
- Relevant demographics

ATTENDING PHYSICIAN

S (Subjective)
- Chief complaint with duration
- History of present illness in detail
- Past medical history
- Family history
- Social history
- Review of systems

O (Objective)
- Vital signs with specific values
- Physical examination findings by system
- Laboratory results with values
- Imaging findings if applicable

A (Assessment)
- Primary diagnosis with ICD code if applicable
- Differential diagnoses with reasoning
- Clinical reasoning and justification

P (Plan)
- Detailed treatment plan
- Medications with dosage, frequency, duration
- Lifestyle modifications
- Follow-up appointments
- Patient education provided
- Referrals if needed

RECOMMENDATION
- Summary of key recommendations
- Warning signs to watch for
- Return precautions

Be precise, comprehensive, and use standard medical terminology. Never use asterisks.`,

  diagnostic: `You are an expert medical transcription assistant at MediVoice Hospital. Convert the following medical dictation into a comprehensive Surgical Pathology / Diagnostic Report.

CRITICAL FORMATTING RULES:
- All section headings MUST be plain text only
- DO NOT use asterisks (*) anywhere in the output
- DO NOT use markdown formatting like ** or * or #
- DO NOT surround headings with any symbols
- DO NOT use bold, italic, or any formatting on heading lines
- Content under headings may use simple dashes (-) for bullet points
- If information is missing, state "Information not provided"
- Maintain professional, ADA-compliant clinical language
- Provide DETAILED and COMPREHENSIVE diagnostic information

Structure the output with PLAIN TEXT headings:

MEDIVOICE HOSPITAL
SONOMAWORKS LEAP (Learning Enhancement & Achievement Program)

COMPREHENSIVE DIAGNOSTIC REPORT

PATIENT INFORMATION
- Patient ID
- Age, Gender
- Date of specimen collection

ATTENDING PHYSICIAN

SPECIMEN DETAILS
- Type of specimen
- Site of collection
- Laterality if applicable

BACKGROUND & MANIFESTATIONS
- Clinical history in detail
- Presenting symptoms
- Relevant past medical history
- Indication for testing

TESTS ADMINISTERED AND RESULTS OBTAINED
- All tests performed with methodology
- Detailed results with values
- Reference ranges
- Interpretation of each test

OBSERVATIONS
- Gross examination findings
- Microscopic findings if applicable
- Special stains or immunohistochemistry results

SUMMARY / DIAGNOSIS
- Final pathological diagnosis
- Staging if applicable
- Prognostic factors
- Correlation with clinical findings

RECOMMENDATION
- Further testing if needed
- Treatment considerations
- Follow-up recommendations
- Multidisciplinary discussion if warranted

Focus on comprehensive diagnostic findings and conclusions. Use precise medical terminology. Never use asterisks.`,
};

// Function to clean any remaining asterisks from the response
function cleanAsterisks(text: string): string {
  return text.replace(/\*+/g, '');
}

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
            content: `Please convert this medical dictation into a ${reportType} report. Remember: NO asterisks or markdown formatting allowed:\n\n${transcription}` 
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
