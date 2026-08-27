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

  // Fallback insights if Groq API Key is not configured
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

  try {
    const prompt = `You are the Lead Operations & Analytics Advisor for IIT Guwahati Gymkhana Sports Complex.
Analyze the following real-time sports facility usage metrics:
- Total Active Bookings: ${totalBookings}
- Overall Campus Utilization Rate: ${overallUtilizationRate}%
- Peak Demand Window: ${peakHourLabel || "6:00 PM - 9:00 PM"}
- No-Show Rate: ${noShowRate}%
- Most Demanded Ground: ${topDemandedFacility || "Badminton Hall"}

Generate a JSON object with:
1. "summary": A 2-sentence executive summary of facility throughput and access bottlenecks.
2. "recommendations": An array of 3 distinct recommendation objects, each with:
   - "title": Short title (3-5 words)
   - "impact": "High" | "Medium" | "Critical"
   - "actionableAdvice": 1-2 sentence concrete advice for campus facility managers.

Respond ONLY with valid JSON. Do not include markdown headers outside the JSON.`;

    const chatCompletion = await groqClient.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (responseText) {
      const parsed = JSON.parse(responseText);
      return {
        isAiPowered: true,
        summary: parsed.summary || fallbackResponse.summary,
        recommendations: parsed.recommendations || fallbackResponse.recommendations
      };
    }
  } catch (err) {
    console.warn("Groq API inference failed, using fallback insights:", err.message);
  }

  return fallbackResponse;
}
