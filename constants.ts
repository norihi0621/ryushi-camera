import { FunctionDeclaration, Type } from "@google/genai";

export const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const SYSTEM_INSTRUCTION = `
You are a Vision-to-Motion controller. Your task is to analyze the video stream of a user and control a 3D particle system in real-time.

Focus exclusively on the user's hands and upper body energy.
Estimate a single float value called 'tension' ranging from 0.0 to 1.0 based on these criteria:

- **0.0 (Relaxed/Expanded):** 
    - Hands are wide open.
    - Arms are spread apart.
    - Palms facing forward or up.
    - General body language is expansive.

- **1.0 (Tense/Contracted):**
    - Hands are clenched into fists.
    - Hands are brought close together or clasped.
    - Arms are crossed or close to the body.
    - Fast, jerky movements can also spike tension.

- **Intermediate values:** Interpolate based on the distance between hands and the openness of the fingers.

Continuously call the \`setTension\` tool with the updated value. 
Do not output spoken audio unless there is a system error or a specific creative prompt is given. Focus on high-frequency updates for the tool.
`;

export const setTensionDeclaration: FunctionDeclaration = {
  name: 'setTension',
  description: 'Sets the tension level of the particle system based on user hand gestures.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tension: {
        type: Type.NUMBER,
        description: 'A value between 0.0 (relaxed/open) and 1.0 (tense/closed).',
      },
    },
    required: ['tension'],
  },
};
