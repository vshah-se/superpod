"""
Workflow Orchestrator
Automated workflow management for SuperPod agents
Compatible with Python 3.11+
"""
import logging
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
from smart_file_manager import SmartFileManager
from transcription_agent import TranscriptionAgent
from summarization_agent import SummarizationAgent
from qa_agent import QAAgent
from message_processor import MessageProcessor

# Ensure Python 3.11+ compatibility
if sys.version_info < (3, 11):
    raise RuntimeError("This script requires Python 3.11 or higher")

class WorkflowOrchestrator:
    """Automated workflow orchestration for SuperPod agents"""
    
    def __init__(self) -> None:
        self.logger = self._setup_logger()
        self.file_manager = SmartFileManager()
        self.message_processor = MessageProcessor()
        
        # Initialize agents
        self.transcription_agent = TranscriptionAgent()
        self.summarization_agent = SummarizationAgent()
        self.qa_agent = QAAgent()
        
        # Workflow status tracking
        self.workflow_status: Dict[str, Any] = {}
        
    def _setup_logger(self) -> logging.Logger:
        """Set up logging with proper configuration"""
        logger = logging.getLogger("WorkflowOrchestrator")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def process_user_request(
        self, 
        user_message: str, 
        intent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process user request with intelligent message processing
        
        Args:
            user_message: User's input message
            intent: Optional intent classification (overrides auto-detection)
            
        Returns:
            Dict with result and workflow information
        """
        try:
            # Step 1: Process message with MessageProcessor
            message_result = self.message_processor.process_message(user_message)
            
            if message_result['status'] == 'error':
                return message_result
            
            # Step 2: Use provided intent or detected intent
            detected_intent = message_result['intent']
            final_intent = intent if intent else detected_intent
            
            # Step 3: Route to appropriate agent based on intent
            if final_intent == 'summarize':
                return self._handle_summarization_request(message_result)
            elif final_intent == 'ask_question':
                return self._handle_question_request(message_result)
            elif final_intent == 'play_audio':
                return self._handle_play_request(message_result)
            else:
                return {
                    'status': 'error',
                    'message': f'Unknown intent: {final_intent}'
                }
                
        except Exception as e:
            self.logger.error(f"Error processing user request: {e}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Error processing request: {str(e)}'
            }
    
    def _handle_summarization_request(self, message_result: Dict[str, Any]) -> Dict[str, Any]:
        """Handle summarization request with proper error handling"""
        try:
            agent_context = message_result['agent_context']
            result = self.summarization_agent.summarize_from_message(agent_context)
            
            # Add workflow information using dict merge (Python 3.9+)
            workflow_info = {
                'message_processed': True,
                'intent': message_result['intent'],
                'target_audio_id': message_result['target_audio_id']
            }
            
            # Use dict.update() for Python 3.11 compatibility
            if isinstance(result, dict):
                result.update({'workflow_info': workflow_info})
            else:
                result = {'workflow_info': workflow_info, 'result': result}
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error in summarization request: {e}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Error in summarization: {str(e)}'
            }
    
    def _handle_question_request(self, message_result: Dict[str, Any]) -> Dict[str, Any]:
        """Handle question request with proper error handling"""
        try:
            agent_context = message_result['agent_context']
            result = self.qa_agent.answer_from_message(agent_context)
            
            # Add workflow information
            workflow_info = {
                'message_processed': True,
                'intent': message_result['intent'],
                'target_audio_id': message_result['target_audio_id']
            }
            
            # Use dict.update() for Python 3.11 compatibility
            if isinstance(result, dict):
                result.update({'workflow_info': workflow_info})
            else:
                result = {'workflow_info': workflow_info, 'result': result}
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error in question request: {e}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Error in Q&A: {str(e)}'
            }
    
    def _handle_play_request(self, message_result: Dict[str, Any]) -> Dict[str, Any]:
        """Handle play request with proper error handling"""
        try:
            target_audio_id = message_result['target_audio_id']
            file_context = message_result.get('file_context', {})
            file_paths = file_context.get('file_paths', {})
            
            workflow_info = {
                'message_processed': True,
                'intent': message_result['intent']
            }
            
            if 'audio' in file_paths:
                return {
                    'status': 'success',
                    'intent': 'play_audio',
                    'target_audio_id': target_audio_id,
                    'audio_file': file_paths['audio'],
                    'message': f'Ready to play audio_{target_audio_id}',
                    'workflow_info': workflow_info
                }
            else:
                return {
                    'status': 'error',
                    'message': f'Audio file not available for audio_{target_audio_id}',
                    'workflow_info': workflow_info
                }
                
        except Exception as e:
            self.logger.error(f"Error in play request: {e}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Error in audio playback: {str(e)}'
            }
    
    # Keep existing methods for backward compatibility
    def _classify_intent(self, query: str) -> str:
        """Classify user intent from query"""
        query_lower = query.lower()
        
        # Question patterns
        question_words = ['what', 'how', 'why', 'when', 'where', 'who', '?']
        if any(word in query_lower for word in question_words):
            return 'ask_question'
        
        # Summary patterns
        summary_words = ['summarize', 'summary', 'overview', 'recap']
        if any(word in query_lower for word in summary_words):
            return 'summarize'
        
        # Play patterns
        play_words = ['play', 'listen', 'audio', 'sound']
        if any(word in query_lower for word in play_words):
            return 'play_audio'
        
        # Default to question if unclear
        return 'ask_question'
    
    def _get_required_types(self, intent: str) -> List[str]:
        """Get required file types for specific intent"""
        requirements = {
            'ask_question': ['transcript', 'summary'],
            'summarize': ['transcript'],
            'play_audio': ['audio'],
            'transcribe': ['audio']
        }
        
        return requirements.get(intent, ['transcript'])
    
    def _resolve_dependencies(
        self, 
        audio_id: str, 
        required_types: List[str]
    ) -> Dict[str, Any]:
        """
        Resolve missing dependencies by triggering appropriate agents
        
        Args:
            audio_id: Audio identifier
            required_types: Required file types
            
        Returns:
            Dict with resolution status and actions taken
        """
        actions_taken: List[str] = []
        errors: List[str] = []
        
        # Check current state
        try:
            dependency_check = self.file_manager.ensure_dependencies(audio_id, required_types)
        except Exception as e:
            self.logger.error(f"Error checking dependencies: {e}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Error checking dependencies: {str(e)}',
                'actions_taken': actions_taken
            }
        
        if dependency_check['status'] == 'ready':
            return {
                'status': 'ready',
                'message': 'All dependencies satisfied',
                'actions_taken': actions_taken
            }
        
        if dependency_check['status'] == 'not_found':
            return {
                'status': 'error',
                'message': f'Audio {audio_id} not found in system',
                'actions_taken': actions_taken
            }
        
        # Resolve missing dependencies
        missing_types = dependency_check.get('missing_types', [])
        
        for missing_type in missing_types:
            try:
                if missing_type == 'transcript':
                    result = self._generate_transcript(audio_id)
                    if result['success']:
                        actions_taken.append(f'Generated transcript for audio_{audio_id}')
                    else:
                        errors.append(f'Failed to generate transcript: {result["error"]}')
                
                elif missing_type == 'summary':
                    result = self._generate_summary(audio_id)
                    if result['success']:
                        actions_taken.append(f'Generated summary for audio_{audio_id}')
                    else:
                        errors.append(f'Failed to generate summary: {result["error"]}')
                
            except Exception as e:
                error_msg = f'Error generating {missing_type}: {str(e)}'
                errors.append(error_msg)
                self.logger.error(error_msg, exc_info=True)
        
        if errors:
            return {
                'status': 'error',
                'message': 'Failed to resolve some dependencies',
                'errors': errors,
                'actions_taken': actions_taken
            }
        
        return {
            'status': 'ready',
            'message': 'Dependencies resolved successfully',
            'actions_taken': actions_taken
        }
    
    def _generate_transcript(self, audio_id: str) -> Dict[str, Any]:
        """Generate transcript for audio with proper error handling"""
        try:
            # Get audio file path
            audio_paths = self.file_manager.get_file_paths(audio_id, ['audio'])
            if 'audio' not in audio_paths:
                return {
                    'success': False,
                    'error': f'Audio file not found for audio_{audio_id}'
                }
            
            audio_file = audio_paths['audio']
            output_dir = str(self.file_manager.transcriptions_dir)
            
            # Generate transcript
            success = self.transcription_agent.process(audio_file, output_dir)
            
            if success:
                # Refresh file manager cache
                self.file_manager._refresh_cache_if_needed()
                return {'success': True}
            else:
                return {
                    'success': False,
                    'error': 'Transcription agent failed'
                }
                
        except Exception as e:
            self.logger.error(f"Error generating transcript: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_summary(self, audio_id: str) -> Dict[str, Any]:
        """Generate summary for audio with proper error handling"""
        try:
            # Get transcript file path
            transcript_paths = self.file_manager.get_file_paths(audio_id, ['transcript'])
            if 'transcript' not in transcript_paths:
                return {
                    'success': False,
                    'error': f'Transcript file not found for audio_{audio_id}'
                }
            
            transcript_file = transcript_paths['transcript']
            output_dir = str(self.file_manager.summaries_dir)
            
            # Generate summary
            success = self.summarization_agent.process(transcript_file, output_dir)
            
            if success:
                # Refresh file manager cache
                self.file_manager._refresh_cache_if_needed()
                return {'success': True}
            else:
                return {
                    'success': False,
                    'error': 'Summarization agent failed'
                }
                
        except Exception as e:
            self.logger.error(f"Error generating summary: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_available_content_suggestions(self) -> List[str]:
        """Get suggestions for available content"""
        try:
            available = self.file_manager.list_available_content()
            suggestions: List[str] = []
            
            if available.get('complete'):
                suggestions.append(f"Available complete content: {len(available['complete'])} items")
            
            if available.get('transcribed'):
                suggestions.append(f"Available transcribed content: {len(available['transcribed'])} items")
            
            if available.get('audio_only'):
                suggestions.append(f"Available audio-only content: {len(available['audio_only'])} items")
            
            return suggestions
        except Exception as e:
            self.logger.error(f"Error getting content suggestions: {e}", exc_info=True)
            return []
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status with error handling"""
        try:
            available = self.file_manager.list_available_content()
            
            total_content = sum(len(items) for items in available.values() if isinstance(items, list))
            
            return {
                'status': 'operational',
                'total_content': total_content,
                'content_breakdown': available,
                'workflow_status': self.workflow_status,
                'python_version': sys.version_info[:2]  # Include Python version info
            }
        except Exception as e:
            self.logger.error(f"Error getting system status: {e}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Error getting system status: {str(e)}',
                'python_version': sys.version_info[:2]
            } 