import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI Gateway with vision model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert livestock classification AI. Your task is to analyze images and determine if they contain cattle or buffalo. 

Provide your response in JSON format with:
- prediction: "cattle" or "buffalo"
- confidence: a number between 0 and 1 
- features: an object with two arrays:
  - cattle: list of visual features that suggest cattle
  - buffalo: list of visual features that suggest buffalo

Key distinguishing features:
Cattle: smaller body size, shorter and wider head, smaller curved horns, lighter colored coat (often brown/white), less pronounced hump, dewlap often present
Buffalo: larger and more muscular body, longer and narrower head, large curved or spiral horns, darker coat (black/dark grey), prominent hump on shoulders, thicker and darker skin

Example response:
{
  "prediction": "cattle",
  "confidence": 0.92,
  "features": {
    "cattle": ["Lighter brown coat color", "Smaller body frame", "Short curved horns", "Visible dewlap"],
    "buffalo": ["Somewhat dark coloring"]
  }
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image and classify it as either cattle or buffalo. Provide detailed reasoning based on visual features.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI classification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the JSON response from AI
    let classificationData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      classificationData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      
      // Fallback: try to extract data using regex
      const prediction = aiResponse.toLowerCase().includes('buffalo') ? 'buffalo' : 'cattle';
      classificationData = {
        prediction,
        confidence: 0.75,
        features: {
          cattle: ['Unable to extract detailed features'],
          buffalo: ['Unable to extract detailed features']
        }
      };
    }

    // Validate and normalize the response
    const result = {
      prediction: classificationData.prediction?.toLowerCase() === 'buffalo' ? 'buffalo' : 'cattle',
      confidence: Math.min(Math.max(classificationData.confidence || 0.5, 0), 1),
      features: {
        cattle: Array.isArray(classificationData.features?.cattle) 
          ? classificationData.features.cattle 
          : ['Visual analysis complete'],
        buffalo: Array.isArray(classificationData.features?.buffalo) 
          ? classificationData.features.buffalo 
          : ['Visual analysis complete']
      }
    };

    console.log('Classification successful:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in classify-livestock function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
