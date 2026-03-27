import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '../config';
import { SensorData, Plant } from '../types';

const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for web/browser usage
});

export interface SoilAnalysisRequest {
  potNumber: number;
  soilMoisture: number;
  plant: Plant;
  temperature: number;
  humidity: number;
}

export interface NPKAnalysisRequest {
  potNumber: number;
  soilMoisture: number;
  npk: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  plant: Plant;
  temperature: number;
  humidity: number;
}

/**
 * Get AI-powered soil recommendation based on NPK sensor data
 */
export const getNPKSoilRecommendation = async ({
  potNumber,
  soilMoisture,
  npk,
  plant,
  temperature,
  humidity,
}: NPKAnalysisRequest): Promise<{ recommendation: string; fertilizerAdvice: string }> => {
  try {
    const prompt = `You are an AI assistant for a smart greenhouse with NPK soil sensors. Analyze the following soil conditions and provide detailed fertilizer recommendations:

Plant: ${plant.name}
Pot Number: ${potNumber}
Current Soil Moisture: ${soilMoisture}%
NPK Readings:
- Nitrogen (N): ${npk.nitrogen} mg/kg
- Phosphorus (P): ${npk.phosphorus} mg/kg
- Potassium (K): ${npk.potassium} mg/kg
Current Temperature: ${temperature}°C
Current Humidity: ${humidity}%

Optimal conditions for ${plant.name}:
- Temperature: ${plant.optimalTemp.min}°C - ${plant.optimalTemp.max}°C
- Humidity: ${plant.optimalHumidity.min}% - ${plant.optimalHumidity.max}%
- Soil Moisture: ${plant.optimalSoilMoisture.min}% - ${plant.optimalSoilMoisture.max}%

NPK Reference Ranges (mg/kg):
- Nitrogen: Low (<50), Medium (50-100), High (>100)
- Phosphorus: Low (<20), Medium (20-40), High (>40)
- Potassium: Low (<100), Medium (100-200), High (>200)

Provide a JSON response with exactly this structure:
{
  "recommendation": "Brief analysis of current soil condition (2-3 sentences)",
  "fertilizerAdvice": "Specific fertilizer recommendation with NPK ratio and application instructions (3-4 sentences)"
}

Consider:
1. Which nutrients are deficient or excessive for this plant type
2. How soil moisture affects nutrient availability
3. Specific fertilizer type and NPK ratio recommended
4. Application frequency and dosage guidance`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    
    // Try to parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          recommendation: parsed.recommendation || 'Unable to get recommendation. Please try again.',
          fertilizerAdvice: parsed.fertilizerAdvice || 'No specific fertilizer advice available.'
        };
      }
    } catch (e) {
      // If JSON parsing fails, return the raw response
    }
    
    return {
      recommendation: content,
      fertilizerAdvice: 'No specific fertilizer advice available.'
    };
  } catch (error) {
    console.error('Error getting NPK recommendation:', error);
    throw error;
  }
};

/**
 * Legacy function - kept for backward compatibility
 */
export const getSoilRecommendation = async ({
  potNumber,
  soilMoisture,
  plant,
  temperature,
  humidity,
}: SoilAnalysisRequest): Promise<string> => {
  try {
    const prompt = `You are an AI assistant for a smart greenhouse. Analyze the following conditions and provide a soil recommendation:

Plant: ${plant.name}
Pot Number: ${potNumber}
Current Soil Moisture: ${soilMoisture}%
Current Temperature: ${temperature}°C
Current Humidity: ${humidity}%

Optimal conditions for ${plant.name}:
- Temperature: ${plant.optimalTemp.min}°C - ${plant.optimalTemp.max}°C
- Humidity: ${plant.optimalHumidity.min}% - ${plant.optimalHumidity.max}%
- Soil Moisture: ${plant.optimalSoilMoisture.min}% - ${plant.optimalSoilMoisture.max}%

Provide a concise recommendation (2-3 sentences) about:
1. Current soil condition status
2. What action to take (water, wait, improve drainage, etc.)
3. Any additional tips for optimal growth`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || 'Unable to get recommendation. Please try again.';
  } catch (error) {
    console.error('Error getting soil recommendation:', error);
    throw error;
  }
};

export const chatWithAI = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: {
    sensorData?: SensorData;
    plant?: Plant;
  }
): Promise<string> => {
  try {
    let systemContext = 'You are a helpful AI assistant for a smart greenhouse. You help users with questions about plant care, greenhouse management, and optimal growing conditions.';

    if (context?.plant && context?.sensorData) {
      systemContext += `

Current greenhouse context:
- Selected Plant: ${context.plant.name}
- Temperature: ${context.sensorData.temperature}°C (Optimal: ${context.plant.optimalTemp.min}-${context.plant.optimalTemp.max}°C)
- Humidity: ${context.sensorData.humidity}% (Optimal: ${context.plant.optimalHumidity.min}-${context.plant.optimalHumidity.max}%)
- Soil Moisture - Pot 1: ${context.sensorData.soilMoisture.pot1}%, Pot 2: ${context.sensorData.soilMoisture.pot2}%, Pot 3: ${context.sensorData.soilMoisture.pot3}%`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemContext },
        ...messages,
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 'Unable to process your request. Please try again.';
  } catch (error) {
    console.error('Error chatting with AI:', error);
    throw error;
  }
};
