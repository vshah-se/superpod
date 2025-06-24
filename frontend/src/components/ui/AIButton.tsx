import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { openAIService } from '../../services/openai';

interface AIButtonProps {
  className?: string;
  onClick?: () => void;
}

enum AIState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  SPEAKING = 'speaking'
}

const AIButton: React.FC<AIButtonProps> = ({ className = "", onClick }) => {
  const [aiState, setAiState] = useState<AIState>(AIState.IDLE);
  const [isGlowing, setIsGlowing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [displayedResponse, setDisplayedResponse] = useState<string>('');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isReadyToListen, setIsReadyToListen] = useState(false);
  
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  // Auto-stop listening after silence
  useEffect(() => {
    let silenceTimer: number | undefined;
    
    if (isListening && aiState === AIState.LISTENING) {
      console.log('Setting up silence timer, current transcript:', transcript);
      // Clear any existing timer
      if (silenceTimer) clearTimeout(silenceTimer);
      
      // If we have transcript, start the silence timer
      if (transcript && transcript.trim()) {
        console.log('Starting 3-second silence timer');
        silenceTimer = setTimeout(() => {
          if (isListening && aiState === AIState.LISTENING) {
            console.log('Silence timeout triggered, stopping listening');
            stopListening();
            handleSpeechEnd();
          }
        }, 3000);
      }
    }

    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
    };
  }, [isListening, transcript, aiState]);

  // Disabled: Voice activity detection during AI speaking - let AI finish speaking
  // useEffect(() => {
  //   if (aiState === AIState.SPEAKING && isConversationActive) {
  //     console.log('Starting voice activity detection during AI speech...');
  //     
  //     // Start listening for interruptions
  //     const startInterruptionDetection = async () => {
  //       try {
  //         await startRecording();
  //         startListening();
  //       } catch (error) {
  //         console.error('Failed to start interruption detection:', error);
  //       }
  //     };
  //     
  //     startInterruptionDetection();
  //   }
  // }, [aiState, isConversationActive]);

  // Disabled: Handle user interruption during AI speech
  // useEffect(() => {
  //   if (aiState === AIState.SPEAKING && transcript && transcript.trim().length > 3) {
  //     console.log('User interrupted AI with:', transcript);
  //     handleUserInterruption();
  //   }
  // }, [transcript, aiState]);

  // Progressive text display for AI response
  useEffect(() => {
    if (aiState === AIState.SPEAKING && aiResponse) {
      console.log('Starting progressive text display for:', aiResponse);
      setDisplayedResponse('');
      
      // Split response into sentences or meaningful chunks
      const splitIntoChunks = (text: string) => {
        // First try to split by sentences
        let chunks = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        
        // If no sentences found, split by commas or natural pauses
        if (chunks.length <= 1) {
          chunks = text.split(/(?<=,)\s+|(?<=;)\s+/).filter(s => s.trim());
        }
        
        // If still one chunk and it's very long, split by phrases (every ~50 chars at word boundaries)
        if (chunks.length <= 1 && text.length > 80) {
          const words = text.split(' ');
          chunks = [];
          let currentChunk = '';
          
          for (const word of words) {
            if (currentChunk.length + word.length + 1 > 60) {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = word;
            } else {
              currentChunk += (currentChunk ? ' ' : '') + word;
            }
          }
          if (currentChunk) chunks.push(currentChunk.trim());
        }
        
        return chunks.filter(chunk => chunk.trim());
      };
      
      const sentences = splitIntoChunks(aiResponse);
      console.log('Split into chunks:', sentences);
      
      if (sentences.length === 0) {
        setDisplayedResponse(aiResponse);
        return;
      }
      
      let currentSentenceIndex = 0;
      let displayedText = '';
      
      const showNextSentence = () => {
        if (currentSentenceIndex < sentences.length) {
          displayedText += (displayedText ? ' ' : '') + sentences[currentSentenceIndex];
          setDisplayedResponse(displayedText);
          currentSentenceIndex++;
          
          if (currentSentenceIndex < sentences.length) {
            // Wait 1 second before showing next sentence (much faster)
            setTimeout(showNextSentence, 1000);
          }
        }
      };
      
      // Start showing sentences
      showNextSentence();
      
      // Cleanup function
      return () => {
        // No interval to clear, but we can add cleanup if needed
      };
    } else if (aiState !== AIState.SPEAKING) {
      setDisplayedResponse('');
    }
  }, [aiState, aiResponse]);

  // Disabled: User interruption functionality
  // const handleUserInterruption = async () => {
  //   console.log('Handling user interruption...');
  //   
  //   // Stop current AI audio
  //   if (currentAudio) {
  //     currentAudio.pause();
  //     currentAudio.currentTime = 0;
  //     setCurrentAudio(null);
  //   }
  //   
  //   // Stop any ongoing speech recognition and recording for interruption detection
  //   stopListening();
  //   await stopRecording();
  //   
  //   // Process the interrupting speech
  //   if (transcript.trim()) {
  //     handleSpeechEnd();
  //   }
  // };

  const startListeningSession = async () => {
    console.log('=== STARTING LISTENING SESSION ===');
    setIsReadyToListen(false);
    
    try {
      // Force stop everything first
      console.log('Force stopping all existing sessions...');
      stopListening();
      await stopRecording();
      
      // Clear transcript
      resetTranscript();
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start fresh
      console.log('Starting fresh recording...');
      await startRecording();
      
      console.log('Starting fresh speech recognition...');
      startListening();
      
      // Mark ready
      setIsReadyToListen(true);
      console.log('=== LISTENING SESSION READY ===');
      
    } catch (error) {
      console.error('Failed to start listening session:', error);
      setAiState(AIState.IDLE);
      setIsGlowing(false);
      setIsConversationActive(false);
      setIsReadyToListen(false);
    }
  };

  const cleanupListeningSession = async () => {
    console.log('=== CLEANING UP LISTENING SESSION ===');
    setIsReadyToListen(false);
    
    try {
      stopListening();
      await stopRecording();
      resetTranscript();
      console.log('=== CLEANUP COMPLETED ===');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const handleSpeechEnd = async () => {
    console.log('handleSpeechEnd called with transcript:', transcript);
    
    if (!transcript.trim()) {
      console.log('No transcript available, returning');
      return;
    }

    console.log('Processing transcript:', transcript);
    setAiState(AIState.PROCESSING);
    setIsGlowing(true);
    setIsReadyToListen(false);

    try {
      console.log('Sending to OpenAI:', transcript);
      // Get AI response
      const response = await openAIService.generateResponse(transcript);
      console.log('AI Response received:', response);
      
      // Store the AI response for display
      setAiResponse(response);
      
      // Convert response to speech
      console.log('Converting to speech...');
      const audioBlob = await openAIService.textToSpeech(response);
      console.log('Audio blob created:', audioBlob.size, 'bytes');
      
      setAiState(AIState.SPEAKING);
      
      // Play the audio response and track it
      console.log('Playing audio...');
      const audio = openAIService.playAudio(audioBlob);
      setCurrentAudio(audio);
      
      // Listen for audio end to continue conversation or reset
      audio.onended = async () => {
        console.log('=== AI FINISHED SPEAKING ===');
        setCurrentAudio(null);
        
        if (isConversationActive) {
          console.log('=== CONTINUING CONVERSATION ===');
          setAiState(AIState.LISTENING);
          setIsGlowing(true);
          setAiResponse('');
          setDisplayedResponse('');
          
          // Simple restart - just wait and start fresh
          setTimeout(async () => {
            await startListeningSession();
          }, 1000);
        } else {
          console.log('=== ENDING CONVERSATION ===');
          setAiState(AIState.IDLE);
          setIsGlowing(false);
          resetTranscript();
          setAiResponse('');
          setDisplayedResponse('');
          setIsReadyToListen(false);
        }
      };
      
      // Fallback timeout in case audio doesn't trigger onended
      setTimeout(() => {
        if (currentAudio === audio && audio.paused === false) {
          console.log('Audio fallback timeout triggered');
          audio.onended?.(new Event('ended'));
        }
      }, 10000); // Increased timeout
      
    } catch (error) {
      console.error('AI processing error:', error);
      setAiState(AIState.IDLE);
      setIsGlowing(false);
      resetTranscript();
      setAiResponse('');
      setDisplayedResponse('');
      setIsConversationActive(false);
      setIsReadyToListen(false);
    }
  };

  const handleClick = async () => {
    console.log('AI Button clicked, current state:', aiState, 'isConversationActive:', isConversationActive);
    
    if (onClick) {
      onClick();
    }

    if (aiState === AIState.IDLE) {
      console.log('Starting conversation mode...');
      playStartSound(); // 🔊 Play activation sound
      setAiState(AIState.LISTENING);
      setIsGlowing(true);
      setIsConversationActive(true);
      
      await startListeningSession();
    } else if (aiState === AIState.LISTENING) {
      console.log('Stopping listening, transcript so far:', transcript);
      await cleanupListeningSession();
      
      if (transcript.trim()) {
        handleSpeechEnd();
      } else {
        console.log('No transcript, returning to idle');
        playStopSound(); // 🔊 Play deactivation sound
        setAiState(AIState.IDLE);
        setIsGlowing(false);
        setAiResponse('');
        setDisplayedResponse('');
        setIsConversationActive(false);
      }
    } else if (aiState === AIState.SPEAKING) {
      console.log('Stopping AI speech and ending conversation');
      playStopSound(); // 🔊 Play deactivation sound
      
      // Stop current AI audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      
      // End conversation
      setAiState(AIState.IDLE);
      setIsGlowing(false);
      setAiResponse('');
      setDisplayedResponse('');
      setIsConversationActive(false);
      setIsReadyToListen(false);
      resetTranscript();
      await cleanupListeningSession();
    }
  };

  const getButtonText = (isMobile: boolean = false) => {
    const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const maxLength = isMobile ? 50 : 80;

    console.log('=== BUTTON STATE ===', { 
      aiState, 
      transcript: `"${transcript}"`, 
      isListening, 
      isReadyToListen,
      isRecording 
    });

    switch (aiState) {
      case AIState.LISTENING:
        if (transcript && transcript.trim()) {
          return `"${truncateText(transcript.trim(), maxLength)}"`;
        } else if (isReadyToListen) {
          return 'Start speaking...';
        } else {
          return 'Getting ready...';
        }
      case AIState.PROCESSING:
        return 'Thinking...';
      case AIState.SPEAKING:
        return displayedResponse ? `"${truncateText(displayedResponse, maxLength)}"` : 'AI Speaking...';
      default:
        return isConversationActive ? 'Tap to end conversation' : 'Ask AI Assistant';
    }
  };

  const shouldShowDots = () => {
    return aiState === AIState.LISTENING && !transcript && isReadyToListen;
  };

  // Sound effects
  const playStartSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Rising tone sound (futuristic activation)
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio context not available');
    }
  };

  const playStopSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Falling tone sound (deactivation)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio context not available');
    }
  };

    return (
    <>
      {/* Desktop AI Button */}
      <button
        className={`fixed left-1/2 transform -translate-x-1/2 p-4 transition-all duration-300 overflow-hidden hidden md:block ${className}`}
        style={{
          bottom: '61px', // 56px (media player height) + 5px gap
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          width: '1160px',
          height: '64px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #1e3a8a 100%)',
          border: 'none',
          zIndex: 10,
          boxShadow: isGlowing 
            ? '0 0 25px rgba(30, 58, 138, 0.8), 0 0 50px rgba(30, 58, 138, 0.6), 0 0 75px rgba(30, 58, 138, 0.4)'
            : isConversationActive 
              ? '0 0 15px rgba(34, 197, 94, 0.6), 0 4px 12px rgba(0, 0, 0, 0.2)'
              : '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
        onClick={handleClick}
      >
      {/* Animated stars background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle 2s infinite ${Math.random() * 2}s, float 4s infinite ${Math.random() * 4}s linear`
            }}
          />
        ))}
      </div>
      
      {/* Scanning line effect */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: isGlowing 
            ? 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)'
            : 'none',
          animation: isGlowing ? 'scan 3s infinite linear' : 'none'
        }}
      />
      
            <div className="flex items-center justify-center h-full relative z-10 px-6">
        <div className="flex items-center justify-center space-x-3 w-full max-w-full">
          <img 
            src="/src/assets/meta_logo.svg" 
            alt="Meta Logo" 
            className="w-6 h-6 flex-shrink-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span className="text-white font-medium text-base truncate leading-relaxed text-center">
            {getButtonText(false)}
          </span>
          {shouldShowDots() && (
            <div className="flex space-x-1 flex-shrink-0">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
      </div>
      
      <style>
        {`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes float {
          0% { transform: translateX(-10px); }
          100% { transform: translateX(10px); }
        }
        
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        `}
      </style>
          </button>

      {/* Mobile AI Button */}
      <button
        className={`fixed left-4 right-4 p-3 transition-all duration-300 overflow-hidden block md:hidden ${className}`}
        style={{
          bottom: '61px', // 56px (media player height) + 5px gap
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          height: '64px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #1e3a8a 100%)',
          border: 'none',
          zIndex: 10,
          boxShadow: isGlowing 
            ? '0 0 20px rgba(30, 58, 138, 0.8), 0 0 40px rgba(30, 58, 138, 0.6), 0 0 60px rgba(30, 58, 138, 0.4)'
            : isConversationActive 
              ? '0 0 12px rgba(34, 197, 94, 0.6), 0 4px 12px rgba(0, 0, 0, 0.2)'
              : '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
        onClick={handleClick}
      >
        {/* Animated stars background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle 2s infinite ${Math.random() * 2}s, float 4s infinite ${Math.random() * 4}s linear`
              }}
            />
          ))}
        </div>
        
        {/* Scanning line effect */}
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background: isGlowing 
              ? 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)'
              : 'none',
            animation: isGlowing ? 'scan 3s infinite linear' : 'none'
          }}
        />
        
                <div className="flex items-center justify-center h-full relative z-10 px-4">
          <div className="flex items-center justify-center space-x-2 w-full max-w-full">
            <img 
              src="/src/assets/meta_logo.svg" 
              alt="Meta Logo" 
              className="w-5 h-5 flex-shrink-0"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="text-white font-medium text-sm truncate leading-relaxed text-center">
              {getButtonText(true)}
            </span>
            {shouldShowDots() && (
              <div className="flex space-x-1 flex-shrink-0">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        </div>
        
        <style>
          {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes float {
            0% { transform: translateX(-10px); }
            100% { transform: translateX(10px); }
          }
          
          @keyframes scan {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          `}
        </style>
      </button>
    </>
  );
};

export default AIButton; 