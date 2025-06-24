import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { ChatMessage, ChatResponse } from '../../api/client';
import type { Recommendation } from '../../types/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface ChatInterfaceProps {
  onRecommendationSelect: (recommendation: Recommendation) => void;
}

export function ChatInterface({ onRecommendationSelect }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: 'Hello! I\'m your AI podcast assistant. Ask me anything about the available podcasts, or request specific segments to play.',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatMessage: ChatMessage = {
        message: inputValue,
      };

      const response: ChatResponse = await apiClient.sendChatMessage(chatMessage);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isUser: false,
        timestamp: new Date(),
        segments: response.segments,
      };

      setMessages((prev: Message[]) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error processing your message. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSegmentClick = (segment: { start: number; end: number; text: string }) => {
    // This will be handled by the parent component for audio playback
    console.log('Segment clicked:', segment);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b">
        <h2 className="text-lg font-semibold">AI Chat Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Ask questions about podcasts and get intelligent responses
        </p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <Card className={`p-3 ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <p className="text-sm">{message.text}</p>
                  
                  {message.segments && message.segments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs opacity-70">Relevant segments:</p>
                      {message.segments.map((segment, index) => (
                        <button
                          key={index}
                          onClick={() => handleSegmentClick(segment)}
                          className="block w-full text-left text-xs p-1 rounded hover:bg-muted/50 transition-colors"
                        >
                          {segment.text.substring(0, 100)}...
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about podcasts, request segments, or get recommendations..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}