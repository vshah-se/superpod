import type { APIError } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export interface ChatMessage {
  message: string;
  file_id?: string;
}

export interface ChatResponse {
  response: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface Podcast {
  id: string;
  title: string;
  file_path: string;
  summary?: string;
  duration?: string;
}

export interface Transcript {
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get all available podcasts
  async getPodcasts(): Promise<Podcast[]> {
    return this.request<Podcast[]>('/podcasts');
  }

  // Send chat message
  async sendChatMessage(message: ChatMessage): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Get audio file URL
  getAudioUrl(fileId: string): string {
    return `${this.baseUrl}/audio/${fileId}.mp3`;
  }

  // Get transcript for audio file
  async getTranscript(fileId: string): Promise<Transcript> {
    return this.request<Transcript>(`/transcript/${fileId}`);
  }

  // Check if API is running
  async healthCheck(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/');
  }
}

export const apiClient = new ApiClient();