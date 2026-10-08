import { GoogleGenAI } from '@google/genai';

// Initialize the GoogleGenAI client with the API key from environment variables
export const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
