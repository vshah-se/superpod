import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { mockApiService } from '../../services/mockApi';
import type { ChatMessage, Recommendation } from '../../types/api';
import { 
  Send, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Volume2,
  Square
} from 'lucide-react';

interface AudioChatInterfaceProps {
  onRecommendationSelect?: (recommendation: Recommendation) => void;
  onAudioStart?: () => void; // Called when audio interaction starts
  onAudioStop?: () => void;  // Called when audio interaction stops
}

export function AudioChatInterface({ 
  onRecommendationSelect, 
  onAudioStart, 
  onAudioStop 
}: AudioChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m here to help you discover amazing podcast content. You can type or use voice to ask me anything!',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioSupported, setAudioSupported] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setAudioSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      // Stop any current playback when starting voice interaction
      onAudioStart?.();
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (synthRef.current && !isSpeaking) {
      // Stop any current playback when starting speech
      onAudioStart?.();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onAudioStop?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onAudioStop?.();
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      onAudioStop?.();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await mockApiService.sendChatMessage({
        message: inputMessage,
        conversationId: '1',
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        metadata: {
          recommendations: response.recommendations,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak the response if speech synthesis is available
      if (synthRef.current) {
        speakText(response.response);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-send message when speech recognition is complete
  useEffect(() => {
    if (inputMessage && !isListening && inputMessage.length > 2) {
      // Small delay to ensure the input is fully set
      const timer = setTimeout(() => {
        handleSendMessage();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isListening, inputMessage]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-full max-h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Chat Assistant
          {audioSupported && (
            <div className="flex items-center gap-1 ml-auto">
              {isListening && (
                <div className="flex items-center gap-1 text-sm text-primary">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Listening...
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-1 text-sm text-primary">
                  <Volume2 className="w-4 h-4" />
                  Speaking...
                </div>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed flex-1">{message.content}</p>
                        {message.role === 'assistant' && audioSupported && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                            onClick={() => speakText(message.content)}
                            disabled={isSpeaking}
                          >
                            <Volume2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {message.metadata?.recommendations && message.metadata.recommendations.length > 0 && (
                  <div className="ml-11 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Recommended for you:
                    </p>
                    {message.metadata.recommendations.map((rec, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => onRecommendationSelect?.(rec)}
                      >
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <img
                              src={rec.file.albumArt || '/api/placeholder/60/60'}
                              alt={rec.file.title}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://via.placeholder.com/60x60/6366f1/white?text=${encodeURIComponent(rec.file.title.slice(0, 2))}`;
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1">{rec.file.title}</h4>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {rec.file.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {Math.floor(rec.file.duration / 60)} min • {rec.file.genre}
                                </span>
                                <span className="text-xs font-medium text-primary">
                                  {Math.round(rec.relevanceScore * 100)}% match
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type or speak your message..."
              disabled={isLoading || isListening}
              className="flex-1"
            />
            
            {audioSupported && (
              <>
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading || isSpeaking}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                
                {isSpeaking && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopSpeaking}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
            
            <Button type="submit" disabled={isLoading || isListening || !inputMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}