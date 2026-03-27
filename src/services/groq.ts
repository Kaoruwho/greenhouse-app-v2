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
