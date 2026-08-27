import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
let groqClient = null;

if (apiKey) {
  try {
    groqClient = new Groq({ apiKey });
    console.log("Groq AI SDK client initialized for Analytics Insights.");
  } catch (err) {
    console.warn("Failed to initialize Groq SDK:", err.message);
  }
}

/**
 * Generate AI-powered executive insights using Groq LLM
 */
export async function generateGroqAnalyticsInsights(analyticsData) {
  const { totalBookings, overallUtilizationRate, peakHourLabel, noShowRate, topDemandedFacility } = analyticsData;

  // Fallback insights if Groq API Key is not configured or fails
  const fallbackResponse = {
    isAiPowered: false,
    summary: `Campus ground utilization currently stands at ${overallUtilizationRate}%. Peak slot demand concentrates around ${peakHourLabel || "6:00 PM - 9:00 PM"}.`,
    recommendations: [
      {
        title: "Reallocate Off-Peak Courts",
        impact: "High",
        actionableAdvice: `Demand peaks heavily at ${peakHourLabel || "evening hours"}. Consider converting unused morning slots into open-access training sessions.`
      },
      {
        title: "No-Show Prevention Policy",
        impact: "Medium",
        actionableAdvice: `Current no-show rate is ${noShowRate}%. Implement an automated 15-minute release rule to reallocate unattended court reservations.`
      },
      {
        title: `Expand ${topDemandedFacility || "Badminton Hall"} Capacity`,
        impact: "High",
        actionableAdvice: `${topDemandedFacility || "Badminton Hall"} experiences the highest waitlist queue. Adding portable nets can increase throughput by 30%.`
      }
    ]
  };

  if (!groqClient) {
    return fallbackResponse;
  }

  // Candidate models supported on Groq
  const candidateModels = [
    "qwen/qwen3.6-27b",
    "groq/compound-mini",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
  ];

  const prompt = `You are the Lead Operations & Analytics Advisor for IIT Guwahati Gymkhana Sports Complex.
Analyze the following real-time sports facility usage metrics:
- Total Active Bookings: ${totalBookings}
- Overall Campus Utilization Rate: ${overallUtilizationRate}%
- Peak Demand Window: ${peakHourLabel || "6:00 PM - 9:00 PM"}
- No-Show Rate: ${noShowRate}%
- Most Demanded Ground: ${topDemandedFacility || "Badminton Hall"}

Generate a JSON object with:
1. "summary": A 2-sentence string providing an executive summary of facility throughput and access bottlenecks.
2. "recommendations": An array of 3 distinct recommendation objects, each with:
   - "title": Short title (3-5 words)
   - "impact": "High" | "Medium" | "Critical"
   - "actionableAdvice": 1-2 sentence concrete advice for campus facility managers.

Respond ONLY with valid JSON. Do not include markdown headers or backticks outside the JSON.`;

  for (const modelName of candidateModels) {
    try {
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: modelName,
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      let responseText = chatCompletion.choices[0]?.message?.content || "";
      // Strip markdown code fences if present
      responseText = responseText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

      if (responseText) {
        const parsed = JSON.parse(responseText);

        let summaryText = fallbackResponse.summary;
        if (typeof parsed.summary === "string") {
          summaryText = parsed.summary;
        } else if (typeof parsed.summary === "object" && parsed.summary !== null) {
          summaryText = Object.values(parsed.summary).flat().filter(x => typeof x === "string").join(" ") || fallbackResponse.summary;
        }

        let rawRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
        let normalizedRecs = rawRecs.map((item, idx) => {
          if (typeof item === "string") {
            return { title: `Recommendation #${idx + 1}`, impact: "High", actionableAdvice: item };
          }
          return {
            title: item.title || item.focus || item.name || `Recommendation #${idx + 1}`,
            impact: item.impact || "High",
            actionableAdvice: item.actionableAdvice || item.details || item.action || item.description || "Implement recommended operational adjustments."
          };
        });

        if (normalizedRecs.length === 0) {
          normalizedRecs = fallbackResponse.recommendations;
        }

        console.log(`Successfully generated Groq AI Insights using model '${modelName}'.`);
        return {
          isAiPowered: true,
          summary: summaryText,
          recommendations: normalizedRecs
        };
      }
    } catch (err) {
      console.warn(`Groq API inference with model '${modelName}' failed: ${err.message}. Trying next candidate...`);
    }
  }

  console.warn("All Groq model candidates failed. Using fallback smart insights.");
  return fallbackResponse;
}
