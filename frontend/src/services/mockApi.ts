import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  MediaFile,
  ChatMessageRequest,
  ChatMessageResponse,
  Recommendation,
  SearchResult,
  PlaybackState,
  PlaybackAction,
  TranscriptionSegment,
} from '../types/api';

// Mock data
const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  displayName: 'John Doe',
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-15T10:30:00Z',
};

const mockMediaFiles: MediaFile[] = [
  {
    id: '1',
    filename: 'startup-journey.mp3',
    title: 'The Startup Journey: From Idea to IPO',
    description: 'Deep dive into the entrepreneurial journey with successful founders',
    duration: 3600,
    fileSize: 52428800,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['entrepreneurship', 'startups', 'business', 'IPO'],
    genre: 'Business',
    uploadedAt: '2024-01-10T08:00:00Z',
    processedAt: '2024-01-10T08:30:00Z',
    streamUrl: '/api/stream/1',
    albumArt: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  },
  {
    id: '2',
    filename: 'ai-revolution.mp3',
    title: 'The AI Revolution: What\'s Next?',
    description: 'Exploring the future of artificial intelligence and its impact on society',
    duration: 2700,
    fileSize: 38400000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['artificial intelligence', 'technology', 'future', 'society'],
    genre: 'Technology',
    uploadedAt: '2024-01-12T14:00:00Z',
    processedAt: '2024-01-12T14:25:00Z',
    streamUrl: '/api/stream/2',
    albumArt: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    filename: 'meditation-basics.mp3',
    title: 'Meditation Basics: Finding Inner Peace',
    description: 'A beginner\'s guide to meditation and mindfulness practices',
    duration: 1800,
    fileSize: 25600000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['meditation', 'mindfulness', 'wellness', 'mental health'],
    genre: 'Health & Wellness',
    uploadedAt: '2024-01-14T09:00:00Z',
    processedAt: '2024-01-14T09:15:00Z',
    streamUrl: '/api/stream/3',
    albumArt: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  },
  {
    id: '4',
    filename: 'coding-productivity.mp3',
    title: 'Coding Productivity Hacks',
    description: 'Tips and tricks to boost your programming efficiency',
    duration: 2400,
    fileSize: 34200000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['programming', 'productivity', 'development', 'coding'],
    genre: 'Technology',
    uploadedAt: '2024-01-15T11:00:00Z',
    processedAt: '2024-01-15T11:20:00Z',
    streamUrl: '/api/stream/4',
    albumArt: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop',
  },
  {
    id: '5',
    filename: 'climate-solutions.mp3',
    title: 'Climate Solutions: Technology and Hope',
    description: 'Exploring innovative solutions to climate change',
    duration: 3200,
    fileSize: 45600000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['climate', 'environment', 'technology', 'sustainability'],
    genre: 'Science',
    uploadedAt: '2024-01-16T14:00:00Z',
    processedAt: '2024-01-16T14:30:00Z',
    streamUrl: '/api/stream/5',
    albumArt: 'https://images.unsplash.com/photo-1569163139394-de44cb5894ba?w=400&h=400&fit=crop',
  },
  {
    id: '6',
    filename: 'creative-writing.mp3',
    title: 'The Art of Creative Writing',
    description: 'Unleashing your creativity through storytelling',
    duration: 2800,
    fileSize: 39900000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['writing', 'creativity', 'storytelling', 'literature'],
    genre: 'Arts',
    uploadedAt: '2024-01-17T09:00:00Z',
    processedAt: '2024-01-17T09:25:00Z',
    streamUrl: '/api/stream/6',
    albumArt: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=400&fit=crop',
  },
];

const mockRecommendations: Recommendation[] = [
  {
    file: mockMediaFiles[0],
    reasoningText: 'Based on your interest in entrepreneurship and business growth',
    relevanceScore: 0.92,
    matchedInterests: ['entrepreneurship', 'business'],
  },
  {
    file: mockMediaFiles[1],
    reasoningText: 'You\'ve shown interest in technology and future trends',
    relevanceScore: 0.87,
    matchedInterests: ['technology', 'AI'],
  },
];

// Mock transcription segments for demos
const mockSegments: { [fileId: string]: TranscriptionSegment[] } = {
  'file-1': [
    {
      id: 'seg-1',
      startTime: 120,
      endTime: 180,
      text: 'When it comes to startup funding, timing and preparation are absolutely crucial for success. Many entrepreneurs make the mistake of approaching investors too early.',
      confidence: 0.94,
    },
    {
      id: 'seg-2',
      startTime: 180,
      endTime: 240,
      text: 'Venture capital firms typically look for companies that have achieved product-market fit and are ready to scale rapidly with the right capital injection.',
      confidence: 0.91,
    },
    {
      id: 'seg-3',
      startTime: 420,
      endTime: 480,
      text: 'Building a strong founding team is essential. Investors invest in people just as much as they invest in ideas and market opportunities.',
      confidence: 0.93,
    },
  ],
  'file-2': [
    {
      id: 'seg-4',
      startTime: 60,
      endTime: 120,
      text: 'Artificial intelligence is transforming every industry, from healthcare to transportation. The pace of innovation is unprecedented.',
      confidence: 0.96,
    },
    {
      id: 'seg-5',
      startTime: 300,
      endTime: 360,
      text: 'Machine learning algorithms are becoming more sophisticated, enabling applications we couldn\'t imagine just a few years ago.',
      confidence: 0.92,
    },
  ],
};

// Intent recognition patterns
const playbackIntents = [
  { patterns: ['play', 'start', 'listen'], action: 'play_segment' },
  { patterns: ['jump to', 'go to', 'skip to'], action: 'play_segment' },
  { patterns: ['hear', 'listen to'], action: 'play_segment' },
  { patterns: ['show me', 'find', 'locate'], action: 'play_segment' },
];

// Mock delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock token storage
let mockToken: string | null = null;
let currentConversationId = '1';

export const mockApiService = {
  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await delay(800);
    
    if (credentials.email === 'user@example.com' && credentials.password === 'password') {
      mockToken = 'mock-jwt-token-12345';
      return {
        accessToken: mockToken,
        refreshToken: 'mock-refresh-token-67890',
        expiresIn: 3600,
        user: mockUser,
      };
    }
    
    throw new Error('Invalid credentials');
  },

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    await delay(1000);
    
    const newUser: User = {
      ...mockUser,
      email: userData.email,
      displayName: userData.displayName,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    
    mockToken = 'mock-jwt-token-new-user';
    return {
      accessToken: mockToken,
      refreshToken: 'mock-refresh-token-new',
      expiresIn: 3600,
      user: newUser,
    };
  },

  async logout(): Promise<void> {
    await delay(300);
    mockToken = null;
  },

  // User endpoints
  async getCurrentUser(): Promise<User> {
    await delay(400);
    if (!mockToken) throw new Error('Not authenticated');
    return mockUser;
  },

  // Media endpoints
  async getMediaFiles(params?: { search?: string; limit?: number; offset?: number }): Promise<{
    files: MediaFile[];
    total: number;
    limit: number;
    offset: number;
  }> {
    await delay(600);
    
    let filteredFiles = [...mockMediaFiles];
    
    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.title.toLowerCase().includes(searchTerm) ||
        file.description?.toLowerCase().includes(searchTerm) ||
        file.topics.some(topic => topic.toLowerCase().includes(searchTerm))
      );
    }
    
    const limit = params?.limit || 10;
    const offset = params?.offset || 0;
    const paginatedFiles = filteredFiles.slice(offset, offset + limit);
    
    return {
      files: paginatedFiles,
      total: filteredFiles.length,
      limit,
      offset,
    };
  },

  async getMediaFile(fileId: string): Promise<MediaFile> {
    await delay(400);
    const file = mockMediaFiles.find(f => f.id === fileId);
    if (!file) throw new Error('File not found');
    return file;
  },

  // Chat endpoints
  async sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    await delay(1200);
    
    // Generate mock AI response based on message content
    let response = '';
    let recommendations: Recommendation[] = [];
    let playbackAction: PlaybackAction | undefined;
    let relatedSegments: TranscriptionSegment[] = [];
    
    const message = request.message.toLowerCase();
    
    // Check for playback intent first
    const hasPlayIntent = playbackIntents.some(intent =>
      intent.patterns.some(pattern => message.includes(pattern))
    );

    if (hasPlayIntent) {
      // Determine which content to play based on message
      if (message.includes('startup') || message.includes('funding') || message.includes('venture')) {
        const segment = mockSegments['file-1'][0]; // Startup funding segment
        playbackAction = {
          type: 'play_segment',
          fileId: 'file-1',
          segment,
          intent: 'User requested to play startup funding content',
        };
        response = `🎧 Starting playback: "${segment.text.substring(0, 80)}..." I found the perfect segment about startup funding strategies. This discusses the crucial timing and preparation needed for successful fundraising.`;
      } else if (message.includes('ai') || message.includes('artificial intelligence') || message.includes('machine learning')) {
        const segment = mockSegments['file-2'][0]; // AI segment
        playbackAction = {
          type: 'play_segment',
          fileId: 'file-2',
          segment,
          intent: 'User requested to play AI content',
        };
        response = `🎧 Starting playback: "${segment.text.substring(0, 80)}..." Here's a great segment about AI transforming industries. This covers the unprecedented pace of innovation we're seeing today.`;
      } else if (message.includes('team') || message.includes('founding') || message.includes('investors')) {
        const segment = mockSegments['file-1'][2]; // Team building segment
        playbackAction = {
          type: 'play_segment',
          fileId: 'file-1',
          segment,
          intent: 'User requested content about team building',
        };
        response = `🎧 Starting playback: "${segment.text.substring(0, 80)}..." This segment discusses the importance of building a strong founding team and what investors really look for.`;
      } else {
        // Default to first startup segment if play intent detected but no specific topic
        const segment = mockSegments['file-1'][0];
        playbackAction = {
          type: 'play_segment',
          fileId: 'file-1',
          segment,
          intent: 'User requested playback - showing popular content',
        };
        response = `🎧 Starting playback: Here's one of our most popular segments about startup funding. You can always ask me to "play the part about [specific topic]" to find exactly what you're looking for!`;
      }
    } else {
      // Regular chat responses with related segments
      if (message.includes('startup') || message.includes('business') || message.includes('funding')) {
        response = 'I found some excellent content about startups and entrepreneurship! The startup journey involves many challenges, but with the right mindset and preparation, success is achievable. Try saying "play the part about startup funding" to jump directly to relevant segments.';
        recommendations = [mockRecommendations[0]];
        relatedSegments = mockSegments['file-1'].slice(0, 2);
      } else if (message.includes('ai') || message.includes('technology') || message.includes('artificial intelligence')) {
        response = 'AI and technology are fascinating topics! The current revolution in artificial intelligence is transforming every industry. From machine learning to neural networks, there\'s so much to explore. You can say "play the AI segment" to hear about industry transformation.';
        recommendations = [mockRecommendations[1]];
        relatedSegments = mockSegments['file-2'];
      } else if (message.includes('meditation') || message.includes('wellness')) {
        response = 'Mindfulness and meditation are excellent for mental well-being. Starting with just 10 minutes a day can make a significant difference in your stress levels and overall happiness. I have some beginner-friendly meditation content that might help.';
        recommendations = [{ file: mockMediaFiles[2], reasoningText: 'Perfect for beginners interested in meditation', relevanceScore: 0.95, matchedInterests: ['meditation', 'wellness'] }];
      } else {
        response = 'That\'s an interesting question! I can help you discover relevant podcast content and even play specific segments. Try saying something like "play the part about startup funding" or "listen to the AI discussion" to jump directly to relevant content.';
        recommendations = mockRecommendations.slice(0, 2);
        relatedSegments = [...mockSegments['file-1'].slice(0, 1), ...mockSegments['file-2'].slice(0, 1)];
      }
    }
    
    return {
      response,
      conversationId: request.conversationId || currentConversationId,
      timestamp: new Date().toISOString(),
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      relatedSegments: relatedSegments.length > 0 ? relatedSegments : undefined,
      playbackAction,
    };
  },

  // Search endpoints
  async searchContent(query: string): Promise<SearchResult[]> {
    await delay(800);
    
    const results: SearchResult[] = mockMediaFiles
      .filter(file => 
        file.title.toLowerCase().includes(query.toLowerCase()) ||
        file.description?.toLowerCase().includes(query.toLowerCase()) ||
        file.topics.some(topic => topic.toLowerCase().includes(query.toLowerCase()))
      )
      .map(file => ({
        file,
        relevanceScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
        matchedSegments: [],
        context: `Found match in "${file.title}" - ${file.description?.substring(0, 100)}...`,
      }));
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  },

  async getRecommendations(): Promise<Recommendation[]> {
    await delay(700);
    return mockRecommendations;
  },

  // Playback endpoints
  async startPlayback(fileId: string, startTime?: number): Promise<PlaybackState> {
    await delay(500);
    
    const file = mockMediaFiles.find(f => f.id === fileId);
    if (!file) throw new Error('File not found');
    
    return {
      sessionId: `session-${Date.now()}`,
      file,
      currentTime: startTime || 0,
      duration: file.duration,
      isPlaying: true,
      lastUpdated: new Date().toISOString(),
    };
  },

  // Utility
  isAuthenticated(): boolean {
    return !!mockToken;
  },

  getToken(): string | null {
    return mockToken;
  },
};