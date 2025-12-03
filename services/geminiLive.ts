import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION, setTensionDeclaration } from "../constants";

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any = null;
  private onTensionUpdate: (tension: number) => void;
  private isConnected: boolean = false;

  constructor(onTensionUpdate: (tension: number) => void) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onTensionUpdate = onTensionUpdate;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      this.session = await this.ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO], // We primarily want tool calls, but audio modality is required for connection usually
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [setTensionDeclaration] }],
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            this.isConnected = true;
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleMessage(message);
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            this.isConnected = false;
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
            this.isConnected = false;
          },
        },
      });
    } catch (error) {
      console.error("Failed to connect to Gemini Live:", error);
      throw error;
    }
  }

  private handleMessage(message: LiveServerMessage) {
    // Check for tool calls
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'setTension') {
            const tension = fc.args['tension'] as number;
            // console.log("Gemini set tension:", tension);
            if (typeof tension === 'number') {
                this.onTensionUpdate(tension);
            }
            
            // Acknowledge the tool call
            this.session.sendToolResponse({
                functionResponses: {
                    id: fc.id,
                    name: fc.name,
                    response: { result: "ok" }
                }
            });
        }
      }
    }
  }

  async sendFrame(base64Image: string) {
    if (!this.isConnected || !this.session) return;
    
    try {
        await this.session.sendRealtimeInput({
            media: {
                mimeType: 'image/jpeg',
                data: base64Image
            }
        });
    } catch (e) {
        console.warn("Error sending frame:", e);
    }
  }

  disconnect() {
    if (this.session) {
    //   this.session.close(); // Method might not exist on all versions of the preview SDK wrapper yet, but good practice if available
      this.session = null;
    }
    this.isConnected = false;
  }
}
