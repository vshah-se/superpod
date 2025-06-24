"""
Q&A Agent
Interactive question-answering system for podcast content
"""
import json
import yaml
import logging
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from llama_api_client import LlamaAPIClient

class QAAgent():
    """Agent for interactive podcast Q&A"""
    
    def __init__(self):
        self.client = None
        self.transcript_data = None
        self.summary_data = None
        self.conversation_history = []
        self.logger = self._setup_logger()
        
        # Load prompts configuration
        self.prompts_config = self._load_prompts_config()
        
    def _setup_logger(self) -> logging.Logger:
        """Set up logging"""
        logger = logging.getLogger("QAAgent")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _load_prompts_config(self) -> Dict[str, Any]:
        """Load prompts configuration from YAML file"""
        try:
            config_path = Path(__file__).parent / "prompts.yaml"
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f)
                self.logger.info("QA Agent: Prompts configuration loaded successfully")
                return config
            else:
                self.logger.warning("QA Agent: prompts.yaml not found, using default prompts")
                return self._get_default_prompts()
        except Exception as e:
            self.logger.error(f"QA Agent: Error loading prompts config: {e}")
            return self._get_default_prompts()
    
    def _get_default_prompts(self) -> Dict[str, Any]:
        """Fallback default prompts if YAML file is not available"""
        return {
            "qa": {
                "main_qa_prompt": {
                    "description": "Main Q&A prompt for answering questions about podcast content",
                    "template": "You are an expert podcast analyst and conversational AI assistant. Your task is to answer questions about a podcast episode based on the provided context.\n\n{metadata_context}\n\n{summary_context}\n\n{segments_context}\n\n{history_context}\n\nUSER QUESTION: {user_question}\n\nINSTRUCTIONS:\n- Answer the question based on the podcast content provided\n- Be conversational and engaging in your response\n- If the information isn't available in the context, say so clearly\n- Reference specific timestamps or quotes when relevant\n- Keep your answer concise but informative\n- Maintain a helpful and friendly tone\n\nPlease provide your answer:"
                }
            },
            "model_config": {
                "qa": {
                    "model": "Llama-4-Scout-17B-16E-Instruct-FP8",
                    "temperature": 0.7,
                    "max_tokens": 1024
                }
            }
        }
    
    def _initialize_client(self) -> bool:
        """Initialize Llama API client"""
        try:
            api_key = os.getenv("LLAMA_API_KEY")
            if not api_key:
                self.logger.error("LLAMA_API_KEY not found in environment")
                return False
                
            self.client = LlamaAPIClient(api_key=api_key)
            self.logger.info("Llama API client initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Llama client: {e}")
            return False
    
    def _load_json_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Load JSON data from file"""
        try:
            path = Path(file_path)
            if not path.is_file():
                self.logger.warning(f"File not found: {file_path}")
                return None
                
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
                
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in file {file_path}: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Error loading file {file_path}: {e}")
            return None
    
    def _get_relevant_segments(self, query: str, max_segments: int = 5) -> List[Dict[str, Any]]:
        """Find segments relevant to the query using keyword matching"""
        if not self.transcript_data or not self.transcript_data.get('segments'):
            return []
        
        query_words = set(query.lower().split())
        relevant_segments = []
        
        for segment in self.transcript_data['segments']:
            segment_text = segment.get('text', '').lower()
            # Simple relevance scoring based on keyword overlap
            matches = sum(1 for word in query_words if word in segment_text)
            if matches > 0:
                segment_with_score = segment.copy()
                segment_with_score['relevance_score'] = matches
                relevant_segments.append(segment_with_score)
        
        # Sort by relevance score and return top segments
        relevant_segments.sort(key=lambda x: x['relevance_score'], reverse=True)
        return relevant_segments[:max_segments]
    
    def _create_qa_prompt(self, user_question: str) -> str:
        """Create comprehensive prompt for answering questions"""
        # Get relevant segments
        relevant_segments = self._get_relevant_segments(user_question)
        
        # Build context from summary
        summary_context = ""
        if self.summary_data and self.summary_data.get('summary'):
            summary_context = f"PODCAST SUMMARY:\n{self.summary_data['summary']}\n\n"
        
        # Build context from relevant segments
        segments_context = ""
        if relevant_segments:
            segments_context = "RELEVANT TRANSCRIPT SEGMENTS:\n"
            for i, segment in enumerate(relevant_segments, 1):
                start_time = segment.get('start_s') or segment.get('start', 0)
                end_time = segment.get('end_s') or segment.get('end', 0)
                timestamp = f"{start_time:.1f}s - {end_time:.1f}s"
                segments_context += f"{i}. [{timestamp}]: {segment.get('text', '')}\n"
            segments_context += "\n"
        
        # Build conversation history
        history_context = ""
        if self.conversation_history:
            history_context = "PREVIOUS CONVERSATION:\n"
            for qa in self.conversation_history[-3:]:  # Include last 3 Q&As for context
                history_context += f"Q: {qa['question']}\nA: {qa['answer']}\n\n"
        
        # Get podcast metadata
        metadata_context = ""
        if self.transcript_data and self.transcript_data.get('metadata'):
            metadata = self.transcript_data['metadata']
            duration_min = metadata.get('duration', 0) / 60
            metadata_context = f"PODCAST INFO:\n- Duration: {duration_min:.1f} minutes\n- Language: {metadata.get('language', 'Unknown')}\n\n"
        
        # Get prompt template from config
        prompt_template = self.prompts_config["qa"]["main_qa_prompt"]["template"]
        
        return prompt_template.format(
            metadata_context=metadata_context,
            summary_context=summary_context,
            segments_context=segments_context,
            history_context=history_context,
            user_question=user_question
        )
    
    def _get_answer_stream(self, prompt: str) -> str:
        """Get streaming response from Llama model"""
        try:
            model = self.prompts_config["model_config"]["qa"]["model"]
            temperature = self.prompts_config["model_config"]["qa"]["temperature"]
            max_tokens = self.prompts_config["model_config"]["qa"]["max_tokens"]
            
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                stream=True,
                temperature=temperature,
                max_completion_tokens=max_tokens,
                top_p=0.9,
                repetition_penalty=1.1,
                tools=[]
            )

            collected_text = ""
            for chunk in response:
                delta_content = ""
                
                # Handle different response patterns
                if hasattr(chunk, 'event') and hasattr(chunk.event, 'delta') and hasattr(chunk.event.delta, 'text'):
                    delta_content = chunk.event.delta.text or ''
                elif hasattr(chunk, 'choices') and chunk.choices:
                    choice = chunk.choices[0]
                    if hasattr(choice, 'delta') and choice.delta:
                        delta_content = getattr(choice.delta, 'content', '') or ''
                elif hasattr(chunk, 'content'):
                    delta_content = chunk.content or ''
                else:
                    try:
                        chunk_dict = chunk.model_dump() if hasattr(chunk, 'model_dump') else chunk.__dict__
                        if 'choices' in chunk_dict and chunk_dict['choices']:
                            choice = chunk_dict['choices'][0]
                            if 'delta' in choice and choice['delta'] and 'content' in choice['delta']:
                                delta_content = choice['delta']['content'] or ''
                    except:
                        pass
                
                if delta_content:
                    print(delta_content, end="", flush=True)
                    collected_text += delta_content

            return collected_text
            
        except Exception as e:
            self.logger.error(f"Error getting answer: {e}")
            return f"Error getting response: {str(e)}"
    
    def ask_question(self, question: str) -> str:
        """Process a user question and return the answer"""
        print(f"\nQuestion: {question}")
        print("Thinking...\n")
        
        # Ensure client is initialized
        if not self._initialize_client():
            return "Error: Could not initialize Llama client"
        
        prompt = self._create_qa_prompt(question)
        answer = self._get_answer_stream(prompt)
        
        # Store in conversation history
        self.conversation_history.append({
            "question": question,
            "answer": answer
        })
        
        return answer
    
    def show_available_info(self):
        """Display information about what's available for questions"""
        print("\nAVAILABLE INFORMATION:")
        print("=" * 50)
        
        if self.transcript_data:
            metadata = self.transcript_data.get('metadata', {})
            segments = self.transcript_data.get('segments', [])
            print(f"Transcript: {len(segments)} segments, {metadata.get('duration', 0)/60:.1f} minutes")
            
        if self.summary_data:
            print("Summary: Available with key insights and analysis")
            
        print("\nYou can ask questions about:")
        print("  • Main topics and themes discussed")
        print("  • Specific quotes or statements")
        print("  • Timeline and sequence of topics")
        print("  • Key insights and takeaways")
        print("  • Background information mentioned")
        print("  • Any specific details from the conversation")
    
    def load_data(self, transcript_file: str, summary_file: str = None) -> bool:
        """Load transcript and summary data"""
        try:
            # Load transcript (required)
            self.transcript_data = self._load_json_file(transcript_file)
            if not self.transcript_data:
                self.logger.error("Failed to load transcript data")
                return False
            
            # Load summary (optional)
            if summary_file and Path(summary_file).exists():
                self.summary_data = self._load_json_file(summary_file)
                if self.summary_data:
                    self.logger.info("Summary data loaded successfully")
                else:
                    self.logger.warning("Failed to load summary data, continuing without it")
            else:
                self.logger.info("No summary file provided or found")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error loading data: {e}")
            return False
    
    def process(self, transcript_file: str, summary_file: str = None, interactive: bool = True) -> bool:
        """Start Q&A session"""
        try:
            print(f"Starting Q&A session...")
            print(f"Transcript: {Path(transcript_file).name}")
            if summary_file:
                print(f"Summary: {Path(summary_file).name}")
            
            # Initialize client
            if not self._initialize_client():
                return False
            
            # Load data
            if not self.load_data(transcript_file, summary_file):
                return False
            
            # Show available info
            self.show_available_info()
            
            if not interactive:
                print("\nQ&A agent initialized and ready!")
                return True
            
            # Interactive loop
            print(f"\nInteractive Q&A Session Started!")
            print("Type your questions below. Type 'quit', 'exit', or 'bye' to end the session.")
            print("-" * 60)
            
            while True:
                try:
                    user_input = input("\nYour question: ").strip()
                    
                    if not user_input:
                        continue
                    
                    if user_input.lower() in ['quit', 'exit', 'bye', 'q']:
                        print("\nThanks for using the Q&A system!")
                        break
                    
                    if user_input.lower() in ['help', 'info']:
                        self.show_available_info()
                        continue
                    
                    # Process question
                    answer = self.ask_question(user_input)
                    print(f"\n")  # Add spacing after streaming response
                    
                except KeyboardInterrupt:
                    print("\n\nSession ended by user")
                    break
                except EOFError:
                    print("\n\nSession ended")
                    break
            
            return True
            
        except Exception as e:
            self.logger.error(f"Q&A process failed: {e}")
            print(f"\nQ&A session failed: {e}")
            return False

    def answer_from_message(self, agent_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Answer question from message context
        
        Args:
            agent_context: Context from message processor
            
        Returns:
            Dict with answer result
        """
        try:
            user_message = agent_context.get('user_message', '')
            target_audio_id = agent_context.get('target_audio_id')
            
            # Use same file identification logic as PlayPauseAgent
            transcriptions_dir = os.path.join(os.path.dirname(__file__), "transcriptions")
            transcript_file = None
            summary_file = None
            
            if target_audio_id:
                for fname in os.listdir(transcriptions_dir):
                    if target_audio_id in fname:
                        transcript_file = os.path.join(transcriptions_dir, fname)
                        break
                
                # Also look for summary file
                summaries_dir = os.path.join(os.path.dirname(__file__), "summaries")
                if os.path.exists(summaries_dir):
                    for fname in os.listdir(summaries_dir):
                        if target_audio_id in fname:
                            summary_file = os.path.join(summaries_dir, fname)
                            break

            # If transcript is available, use it for Q&A
            if transcript_file and os.path.isfile(transcript_file):
                self.logger.info(f"Answering question for audio_{target_audio_id} with transcript")
                
                # Load data and ask question
                success = self.load_data(transcript_file, summary_file)
                if success:
                    answer = self.ask_question(user_message)
                    
                    return {
                        'status': 'success',
                        'target_audio_id': target_audio_id,
                        'question': user_message,
                        'answer': answer,
                        'has_transcript': True,
                        'has_summary': summary_file is not None,
                        'message': f'Answered question for audio_{target_audio_id}'
                    }
                else:
                    return {
                        'status': 'error',
                        'message': f'Failed to load data for audio_{target_audio_id}'
                    }
            
            # If no transcript available, send general question to Llama
            else:
                self.logger.info(f"No transcript available, sending general question to Llama")
                
                # Initialize client if needed
                if not self._initialize_client():
                    return {
                        'status': 'error',
                        'message': 'Failed to initialize Llama client'
                    }
                
                # Create general prompt for Llama
                general_prompt = f"""
You are a helpful AI assistant. The user has a question about podcast content.

USER QUESTION: {user_message}

AVAILABLE CONTENT: {agent_context.get('available_content', {})}

Please provide a helpful response to the user's question. If you have information about available podcast content, mention it. Otherwise, provide a general helpful response.
"""
                
                # Get response from Llama
                answer = self._get_answer_stream(general_prompt)
                
                return {
                    'status': 'success',
                    'target_audio_id': target_audio_id,
                    'question': user_message,
                    'answer': answer,
                    'has_transcript': False,
                    'has_summary': False,
                    'message': 'Answered general question without specific transcript'
                }
                
        except Exception as e:
            self.logger.error(f"Error in answer_from_message: {e}")
            return {
                'status': 'error',
                'message': f'Error answering question: {str(e)}'
            } 