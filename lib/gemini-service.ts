import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

interface SceneInfo {
  frameData: string;
  timestamp: number;
}

export async function generateUserStory(
  scenes: SceneInfo[], 
  notes: string,
  subtitles?: string
): Promise<string> {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    // Process base64 images for Gemini and combine with scene information
    const imageObjects = scenes.map(scene => ({
      inlineData: {
        data: scene.frameData.split(',')[1], // Remove the data:image/jpeg;base64, prefix
        mimeType: "image/jpeg"
      }
    }));

    // Create a scene-by-scene description
    const sceneDescriptions = scenes.map((scene, index) => 
      `Scene ${index + 1} (Timestamp: ${formatTime(scene.timestamp)})`
    ).join('\n');

    const prompt = `You are a Product Manager assistant that creates detailed user stories from video frame sequences. 
    Analyze these frames from a video demonstration and create a detailed user story.
    
    Video Timeline:
    ${sceneDescriptions}
    
    ${subtitles ? `Clip Dialogue/Captions:
    ${subtitles}
    
    ` : ''}Context Notes: ${notes}
    
    Each frame represents a key scene change in the video. Consider the sequence and progression of scenes, along with any dialogue or captions, when analyzing the feature demonstration.
    
    Format the user story in the following structure:
    
    Title: [Concise feature title]
    
    As a [type of user]
    I want to [action/feature]
    So that [benefit/value]
    
    Acceptance Criteria:
    1. [Criterion 1]
    2. [Criterion 2]
    3. [Criterion 3]
    
    Technical Notes:
    - [Technical consideration 1]
    - [Technical consideration 2]
    
    Story Points: [1, 2, 3, 5, 8, 13]`;

    const result = await chatSession.sendMessage([
      { text: prompt },
      ...imageObjects
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Error generating user story:', error);
    throw new Error('Failed to generate user story');
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
