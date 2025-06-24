"""
Message Processor
Centralized message processing for SuperPod agents
"""
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from smart_file_manager import SmartFileManager

class MessageProcessor:
    """Centralized message processing for user requests"""
    
    def __init__(self):
        self.logger = self._setup_logger()
        self.file_manager = SmartFileManager()
        
    def _setup_logger(self) -> logging.Logger:
        """Set up logging"""
        logger = logging.getLogger("MessageProcessor")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def process_message(self, user_message: str) -> Dict[str, Any]:
        """
        Process user message and return structured context for agents
        
        Args:
            user_message: User's input message
            
        Returns:
            Dict with parsed intent, target, and file context for agents
        """
        try:
            # Step 1: Parse intent and target
            intent, target_audio_id = self._parse_message(user_message)
            
            # Step 2: Discover relevant files
            file_context = self._discover_files(target_audio_id)
            
            # Step 3: Build context for agents
            agent_context = self._build_agent_context(file_context, user_message)
            
            return {
                'status': 'success',
                'intent': intent,
                'target_audio_id': target_audio_id,
                'file_context': file_context,
                'agent_context': agent_context,
                'user_message': user_message
            }
            
        except Exception as e:
            self.logger.error(f"Error processing message: {e}")
            return {
                'status': 'error',
                'message': f'Error processing message: {str(e)}',
                'user_message': user_message
            }
    
    def _parse_message(self, user_message: str) -> Tuple[str, Optional[str]]:
        """
        Parse user message to extract intent and target audio
        
        Args:
            user_message: User's input message
            
        Returns:
            Tuple of (intent, target_audio_id)
        """
        message_lower = user_message.lower().strip()
        
        # Determine intent
        intent = self._classify_intent(message_lower)
        
        # Extract target audio ID
        target_audio_id = self.file_manager._extract_audio_id(user_message)
        
        return intent, target_audio_id
    
    def _classify_intent(self, message: str) -> str:
        """Classify user intent from message"""
        # Question patterns
        if any(word in message for word in ['what', 'how', 'why', 'when', 'where', 'who', '?']):
            return 'ask_question'
        
        # Summary patterns
        if any(word in message for word in ['summarize', 'summary', 'overview', 'recap']):
            return 'summarize'
        
        # Play patterns
        if any(word in message for word in ['play', 'listen', 'audio', 'sound']):
            return 'play_audio'
        
        # Default to question if unclear
        return 'ask_question'
    
    def _discover_files(self, target_audio_id: Optional[str]) -> Dict[str, Any]:
        """
        Discover relevant files based on target audio ID
        
        Args:
            target_audio_id: Target audio identifier
            
        Returns:
            Dict with file context information
        """
        if not target_audio_id:
            # No specific target, return general context
            return self._get_general_context()
        
        # Get specific file context
        audio_mapping = self.file_manager.find_audio_by_query(target_audio_id)
        if not audio_mapping:
            return self._get_general_context()
        
        return {
            'target_audio_id': target_audio_id,
            'target_mapping': audio_mapping,
            'has_audio': audio_mapping['audio'].get('exists', False),
            'has_transcript': audio_mapping['transcript'].get('exists', False),
            'has_summary': audio_mapping['summary'].get('exists', False),
            'file_paths': self.file_manager.get_file_paths(target_audio_id, ['audio', 'transcript', 'summary'])
        }
    
    def _get_general_context(self) -> Dict[str, Any]:
        """Get general context when no specific target is identified"""
        available = self.file_manager.list_available_content()
        
        return {
            'target_audio_id': None,
            'target_mapping': None,
            'has_audio': False,
            'has_transcript': False,
            'has_summary': False,
            'file_paths': {},
            'available_content': available
        }
    
    def _build_agent_context(self, file_context: Dict[str, Any], user_message: str) -> Dict[str, Any]:
        """
        Build context for agents to use
        
        Args:
            file_context: File discovery results
            user_message: Original user message
            
        Returns:
            Context dict for agents
        """
        context = {
            'user_message': user_message,
            'target_audio_id': file_context.get('target_audio_id'),
            'file_paths': file_context.get('file_paths', {}),
            'has_transcript': file_context.get('has_transcript', False),
            'has_summary': file_context.get('has_summary', False),
            'available_content': file_context.get('available_content', {})
        }
        
        # Add specific file information if available
        if file_context.get('target_audio_id'):
            target_id = file_context['target_audio_id']
            context['target_info'] = {
                'audio_id': target_id,
                'audio_file': f"audio_{target_id}.mp3",
                'transcript_file': f"audio_{target_id}_transcript.json",
                'summary_file': f"audio_{target_id}_summary.json"
            }
        
        return context 