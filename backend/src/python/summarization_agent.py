"""
Summarization Agent
Generates comprehensive podcast summaries using Llama AI
"""
import json
import os
import logging
import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from llama_api_client import LlamaAPIClient

class SummarizationAgent:
    """Agent for generating podcast summaries"""
    
    def __init__(self):
        self.client = None
        self.logger = self._setup_logger()
        # Set up default directories
        self.base_dir = Path(__file__).parent.parent.parent.parent  # Go up to project root
        self.transcriptions_dir = self.base_dir / "transcriptions"
        self.summaries_dir = self.base_dir / "summaries"
        
        # Load prompts configuration
        self.prompts_config = self._load_prompts_config()
        
    def _setup_logger(self):
        """Setup logging for the agent"""
        logger = logging.getLogger("SummarizationAgent")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
        
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.now().isoformat()
        
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
    
    def get_transcript_files(self):
        """Get list of available transcript files"""
        transcript_files = []
        if self.transcriptions_dir.exists():
            for file in self.transcriptions_dir.iterdir():
                if file.is_file() and file.suffix.lower() == '.json':
                    transcript_files.append({
                        'name': file.name,
                        'path': str(file),
                        'size': file.stat().st_size
                    })
        return transcript_files
    
    def _load_transcript(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Load transcript data from JSON file"""
        try:
            path = Path(file_path)
            if not path.is_file():
                self.logger.error(f"Transcript file not found: {file_path}")
                return None
                
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            self.logger.info(f"Transcript loaded: {len(data.get('segments', []))} segments")
            return data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in transcript file: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Error loading transcript: {e}")
            return None
    
    def get_available_prompts(self) -> Dict[str, str]:
        """Get list of available prompt styles"""
        prompts = {}
        if "summarization" in self.prompts_config:
            for prompt_name, prompt_data in self.prompts_config["summarization"].items():
                prompts[prompt_name] = prompt_data.get("description", prompt_name)
        return prompts
    
    def set_prompt_style(self, style: str) -> bool:
        """Set the prompt style for summarization"""
        if style in self.prompts_config.get("summarization", {}):
            self.current_prompt_style = style
            self.logger.info(f"Prompt style set to: {style}")
            return True
        else:
            self.logger.error(f"Unknown prompt style: {style}")
            return False
    
    def _create_summary_prompt(self, transcript_data: Dict[str, Any]) -> str:
        """Create a concise, engaging prompt for podcast synopsis"""
        segments = transcript_data.get('segments', [])
        full_text = transcript_data.get('full_text') or ' '.join(seg['text'] for seg in segments)
        metadata = transcript_data.get('metadata', {})

        total_duration = metadata.get('duration', 0)
        num_segments = len(segments)

        # Get the current prompt style (default to main_synopsis)
        style = getattr(self, 'current_prompt_style', 'main_synopsis')
        prompt_template = self.prompts_config["summarization"][style]["template"]

        return prompt_template.format(
            duration_minutes=total_duration/60,
            num_segments=num_segments,
            full_text=full_text,
            language=metadata.get('language', 'Unknown')
        )
    
    def _create_topic_extraction_prompt(self, transcript_data: Dict[str, Any]) -> str:
        """Create a casual prompt for topic extraction"""
        segments = transcript_data.get('segments', [])
        full_text = transcript_data.get('full_text') or ' '.join(seg['text'] for seg in segments)
        
        prompt = self.prompts_config["summarization"]["topic_extraction"]["template"]

        return prompt.format(
            full_text=full_text
        )
    
    def _extract_key_moments_advanced(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract key moments using advanced semantic analysis"""
        key_moments = []
        
        # Enhanced keywords for better detection
        importance_keywords = self.prompts_config["key_moments"]["importance_keywords"]
        
        # Question indicators
        question_indicators = self.prompts_config["key_moments"]["question_indicators"]
        
        # Quote indicators
        quote_indicators = self.prompts_config["key_moments"]["quote_indicators"]
        
        for i, segment in enumerate(segments):
            text = segment['text'].strip()
            start_ms = int(segment.get('start_ms') or segment.get('start', 0) * 1000)
            end_ms = int(segment.get('end_ms') or segment.get('end', 0) * 1000)
            
            # Calculate importance score
            importance_score = 0
            
            # Length-based scoring
            if len(text) > 150:
                importance_score += 2
            elif len(text) > 100:
                importance_score += 1
            
            # Keyword-based scoring
            text_lower = text.lower()
            for keyword in importance_keywords:
                if keyword in text_lower:
                    importance_score += 2
                    break
            
            # Question-based scoring
            if any(indicator in text_lower for indicator in question_indicators):
                importance_score += 1
            
            # Quote-based scoring
            if any(indicator in text_lower for indicator in quote_indicators):
                importance_score += 1
            
            # Position-based scoring (beginning and end are often important)
            if i < len(segments) * 0.1 or i > len(segments) * 0.9:
                importance_score += 1
            
            # Only include segments with sufficient importance
            if importance_score >= 2:
                key_moments.append({
                    "timestamp": f"{start_ms/1000:.1f}s - {end_ms/1000:.1f}s",
                    "start_ms": start_ms,
                    "text": text[:250] + "..." if len(text) > 250 else text,
                    "importance_score": importance_score,
                    "segment_index": i
                })
        
        # Sort by importance score and return top moments
        key_moments.sort(key=lambda x: x['importance_score'], reverse=True)
        return key_moments[:15]  # Return top 15 moments
    
    def _generate_structured_summary(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a structured summary with multiple components"""
        try:
            # Step 1: Extract topics
            topic_prompt = self._create_topic_extraction_prompt(transcript_data)
            print("Extracting topics...")
            topics_analysis = self._get_summary_stream(topic_prompt)
            
            # Step 2: Generate comprehensive summary
            summary_prompt = self._create_summary_prompt(transcript_data)
            print("Generating comprehensive summary...")
            comprehensive_summary = self._get_summary_stream(summary_prompt)
            
            # Step 3: Extract key moments
            key_moments = self._extract_key_moments_advanced(transcript_data.get('segments', []))
            
            return {
                "topics_analysis": topics_analysis,
                "comprehensive_summary": comprehensive_summary,
                "key_moments": key_moments
            }
            
        except Exception as e:
            self.logger.error(f"Error in structured summary generation: {e}")
            return {
                "topics_analysis": f"Error: {str(e)}",
                "comprehensive_summary": f"Error: {str(e)}",
                "key_moments": []
            }
    
    def _get_summary_stream(self, prompt: str) -> str:
        """Get streaming summary from Llama API"""
        try:
            # Default model settings if config is not available
            model = os.getenv("LLAMA_MODEL", self.prompts_config["model_config"]["default_model"])
            temperature = float(os.getenv("LLAMA_TEMPERATURE", self.prompts_config["model_config"]["default_temperature"]))
            max_tokens = int(os.getenv("LLAMA_MAX_TOKENS", self.prompts_config["model_config"]["default_max_tokens"]))
            
            self.logger.info(f"Generating summary with model: {model}")
            
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                stream=True,
                temperature=temperature,
                max_completion_tokens=max_tokens,
                top_p=0.9,
                repetition_penalty=1,
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
            self.logger.error(f"Error during summary generation: {e}")
            return f"Error generating summary: {str(e)}"
    
    def _save_summary(self, summary_data: Dict[str, Any], output_path: str) -> bool:
        """Save summary to JSON file"""
        try:
            output_file_path = Path(output_path)
            output_file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file_path, 'w', encoding='utf-8') as f:
                json.dump(summary_data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Summary saved to: {output_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save summary: {e}")
            return False
    
    def process(self, transcript_file: str, output_dir: str = None) -> bool:
        """Process transcript and generate summary"""
        try:
            print(f"Starting podcast summarization...")
            print(f"Transcript: {Path(transcript_file).name}")
            
            # Set default output directory if not provided
            if output_dir is None:
                output_dir = str(self.summaries_dir)
            
            # Initialize client
            if not self._initialize_client():
                return False
            
            transcriptions_dir = os.path.join(os.path.dirname(__file__), "transcriptions")
            for fname in os.listdir(transcriptions_dir):
                if transcript_file in fname:
                    transcript_file = os.path.join(transcriptions_dir, fname)
                    break

            if not transcript_file or not os.path.isfile(transcript_file):
                return {"status": "error", "message": f"Transcript for audioid {audioid} not found"}

            # Load audio segments from the transcript file (assuming JSON format)
            with open(transcript_file, "r") as f:
                audio_segments = json.load(f)
            # Load transcript
            transcript_data = audio_segments
            #self._load_transcript(transcript_file)
            if not transcript_data:
                return False
            
            # Create output directory
            output_path = Path("./")
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Generate summary
            print(f"\nGenerating summary...")
            summary = self._generate_structured_summary(transcript_data)
            
            # Prepare summary data
            base_name = Path(transcript_file).stem
            summary_data = {
                "metadata": {
                    "transcript_file": transcript_file,
                    "model_used": os.getenv("LLAMA_MODEL", "Llama-4-Scout-17B-16E-Instruct-FP8"),
                    "created_at": self._get_timestamp(),
                    "agent": "SummarizationAgent",
                    "agent_type": "summarization",
                    "provider": "Llama",
                    "version": "2.1.0",
                    "summary_type": "casual_synopsis"
                },
                "podcast_info": {
                    "duration_seconds": transcript_data['metadata'].get('duration', 0),
                    "duration_minutes": transcript_data['metadata'].get('duration', 0) / 60,
                    "language": transcript_data['metadata'].get('language', 'Unknown'),
                    "total_segments": len(transcript_data.get('segments', [])),
                    "total_text_length": len(transcript_data.get('full_text', ''))
                },
                "topics_analysis": summary.get("topics_analysis", ""),
                "comprehensive_summary": summary.get("comprehensive_summary", ""),
                "key_moments": summary.get("key_moments", []),
                "full_transcript": transcript_data.get('full_text', '')
            }
            
            return summary
            # # Save summary
            # output_file = output_path / f"{base_name}_summary.json"
            # success = self._save_summary(summary_data, str(output_file))
            
            # if success:
            #     print(f"\nCasual podcast synopsis completed!")
            #     print(f"Topics noted: {len(summary.get('topics_analysis', '').split())} words")
            #     print(f"Synopsis: {len(summary.get('comprehensive_summary', '').split())} words")
            #     print(f"Key moments captured: {len(summary.get('key_moments', []))}")
            #     print(f"Saved to: {output_file}")
                
            # return success
            
        except Exception as e:
            self.logger.error(f"Summarization process failed: {e}")
            print(f"\nSummarization failed: {e}")
            return False

    def summarize_from_message(self, agent_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate summary from message context
        
        Args:
            agent_context: Context from message processor
            
        Returns:
            Dict with summary result
        """
        try:
            user_message = agent_context.get('user_message', '')
            target_audio_id = agent_context.get('target_audio_id')
            
            # Use same file identification logic as PlayPauseAgent
            transcriptions_dir = os.path.join(os.path.dirname(__file__), "transcriptions")
            transcript_file = None
            
            if target_audio_id:
                for fname in os.listdir(transcriptions_dir):
                    if target_audio_id in fname:
                        transcript_file = os.path.join(transcriptions_dir, fname)
                        break

            if not transcript_file or not os.path.isfile(transcript_file):
                return {"status": "error", "message": f"Transcript for audioid {target_audio_id} not found"}
                
            self.logger.info(f"Generating summary for audio_{target_audio_id}")
            
            # Use existing process method
            success = self.process(transcript_file)
            
            if success:
                # Get the generated summary file - use the same pattern as process method
                base_name = Path(transcript_file).stem  # This will be "audio_1_transcript" from "audio_1_transcript.json"
                summary_file = f"{base_name}_summary.json"  # This will be "audio_1_transcript_summary.json"
                summary_path = self.summaries_dir / summary_file
                
                if summary_path.exists():
                    with open(summary_path, 'r', encoding='utf-8') as f:
                        summary_data = json.load(f)
                    
                    return {
                        'status': 'success',
                        'target_audio_id': target_audio_id,
                        'summary': summary_data.get('comprehensive_summary', ''),
                        'topics': summary_data.get('topics_analysis', ''),
                        'key_moments': summary_data.get('key_moments', []),
                        'message': f'Summary generated for audio_{target_audio_id}'
                    }
                else:
                    return {
                        'status': 'error',
                        'message': f'Summary file not found: {summary_file}'
                    }
            else:
                return {
                    'status': 'error',
                    'message': f'Failed to generate summary for audio_{target_audio_id}'
                }
                
        except Exception as e:
            self.logger.error(f"Error in summarize_from_message: {e}")
            return {
                'status': 'error',
                'message': f'Error generating summary: {str(e)}'
            }

    def _load_prompts_config(self) -> Dict[str, Any]:
        """Load prompts configuration from YAML file"""
        try:
            config_path = Path(__file__).parent / "prompts.yaml"
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f)
                self.logger.info("Prompts configuration loaded successfully")
                return config
            else:
                self.logger.warning("prompts.yaml not found, using default prompts")
                return self._get_default_prompts()
        except Exception as e:
            self.logger.error(f"Error loading prompts config: {e}")
            return self._get_default_prompts()
    
    def _get_default_prompts(self) -> Dict[str, Any]:
        """Fallback default prompts if YAML file is not available"""
        return {
            "summarization": {
                "main_synopsis": {
                    "description": "Creates a casual, engaging podcast synopsis",
                    "template": "You're a podcast enthusiast who just listened to this episode and wants to tell a friend what it's about. Write a casual, engaging synopsis that captures the vibe and key points.\n\nPODCAST INFO:\n- Duration: {duration_minutes:.1f} minutes\n- Segments: {num_segments}\n\nTRANSCRIPT:\n{full_text}\n\nTASK: Write a casual, engaging podcast synopsis in this format:\n\n## WHAT'S THIS ABOUT?\n[2-3 sentences in a conversational tone - what's the main vibe and topic?]\n\n## KEY TOPICS COVERED\n• [Topic 1 - casual description]\n• [Topic 2 - casual description] \n• [Topic 3 - casual description]\n\n## COOL INSIGHTS\n[2-3 interesting takeaways in a friendly tone]\n\n## WHO SHOULD LISTEN?\n[Quick note on who'd enjoy this - keep it casual!]\n\nKeep it conversational, engaging, and under 200 words total. Write like you're chatting with a friend about a podcast you just heard."
                },
                "topic_extraction": {
                    "description": "Extracts main topics in a casual tone",
                    "template": "Hey! I just listened to this podcast and want to quickly jot down what they talked about. Can you help me identify the main topics?\n\nTRANSCRIPT:\n{full_text}\n\nJust give me a quick list of the main things they discussed, like you're telling a friend what the podcast was about. Keep it casual and to the point!"
                }
            },
            "key_moments": {
                "importance_keywords": ["important", "key", "main", "primary", "significant", "crucial", "essential"],
                "question_indicators": ["what", "how", "why", "when", "where", "who", "?"],
                "quote_indicators": ["said", "mentioned", "stated", "explained", "described", "noted"]
            },
            "model_config": {
                "default_model": "Llama-4-Scout-17B-16E-Instruct-FP8",
                "default_temperature": 0.6,
                "default_max_tokens": 2048
            }
        } 