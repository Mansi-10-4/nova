
import { GoogleGenAI } from "@google/genai";
import { Product, ImageSize } from "../types";

// Note: For image generation, we create a fresh instance to ensure the latest API key is used
// Always use process.env.API_KEY directly as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getProductInsight = async (product: Product): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Basic Text Task
      contents: `You are a high-end design critic. Briefly describe why someone should buy the ${product.name}. 
      It is described as: ${product.description}. 
      Keep it under 30 words and sound sophisticated but minimalist.`,
    });
    return response.text || "A masterpiece of modern design and utility.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "A curated choice for the modern home.";
  }
};

export const getSmartRecommendations = async (lastAdded: Product, allProducts: Product[]): Promise<string[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Complex Text Task for better reasoning
      contents: `Based on the fact a user just added "${lastAdded.name}" to their cart, which 2 products from this list should I recommend next? 
      List: ${allProducts.map(p => p.name).join(', ')}.
      Return ONLY the names of the 2 products, separated by a comma.`,
    });
    const names = response.text?.split(',').map(n => n.trim()) || [];
    return names;
  } catch (error) {
    return [];
  }
};

export const generateImage = async (prompt: string, size: ImageSize = '1K'): Promise<string> => {
  const ai = getAI();
  
  // Use gemini-3-pro-image-preview for high quality (2K/4K) or if imageSize is needed.
  // Otherwise use gemini-2.5-flash-image for standard tasks.
  const isHighRes = size === '2K' || size === '4K';
  const modelName = isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        // imageSize is only supported for gemini-3-pro-image-preview
        ...(isHighRes ? { imageSize: size } : {})
      }
    }
  });

  // Find the image part as it may not be the first part as per guidelines
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData?.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  
  throw new Error("Failed to generate image or no image data returned.");
};
