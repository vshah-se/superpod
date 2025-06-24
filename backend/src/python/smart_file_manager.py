"""
Smart File Manager
Intelligent file matching and workflow orchestration for SuperPod agents
"""
import json
import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

class SmartFileManager:
    """Intelligent file management and workflow orchestration"""
    
    def __init__(self):
        self.logger = self._setup_logger()
        
        # Set up directory paths
        self.base_dir = Path(__file__).parent
        self.audio_dir = self.base_dir / "audio_files"
        self.transcriptions_dir = self.base_dir / "transcriptions"
        self.summaries_dir = self.base_dir / "summaries"
        
        # File pattern mappings
        self.file_patterns = {
            'audio': r'audio_(\d+)\.mp3',
            'transcript': r'audio_(\d+)_transcript\.json',
            'summary': r'audio_(\d+)_summary\.json'
        }
        
        # Cache for file mappings
        self._file_cache = None
        self._cache_timestamp = None
        
    def _setup_logger(self) -> logging.Logger:
        """Set up logging"""
        logger = logging.getLogger("SmartFileManager")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _refresh_cache_if_needed(self):
        """Refresh file cache if it's stale or doesn't exist"""
        current_time = datetime.now()
        if (self._file_cache is None or 
            self._cache_timestamp is None or 
            (current_time - self._cache_timestamp).seconds > 30):  # Refresh every 30 seconds
            self._build_file_mappings()
            self._cache_timestamp = current_time
    
    def _build_file_mappings(self):
        """Build comprehensive file mappings"""
        import re
        
        self._file_cache = {
            'audio_files': {},
            'transcript_files': {},
            'summary_files': {},
            'all_mappings': {}
        }
        
        # Scan audio files
        if self.audio_dir.exists():
            for file in self.audio_dir.iterdir():
                if file.is_file() and file.suffix.lower() == '.mp3':
                    match = re.match(r'audio_(\d+)\.mp3', file.name)
                    if match:
                        audio_id = match.group(1)
                        self._file_cache['audio_files'][audio_id] = {
                            'path': str(file),
                            'name': file.name,
                            'size': file.stat().st_size,
                            'exists': True
                        }
        
        # Scan transcript files
        if self.transcriptions_dir.exists():
            for file in self.transcriptions_dir.iterdir():
                if file.is_file() and file.suffix.lower() == '.json':
                    match = re.match(r'audio_(\d+)_transcript\.json', file.name)
                    if match:
                        audio_id = match.group(1)
                        self._file_cache['transcript_files'][audio_id] = {
                            'path': str(file),
                            'name': file.name,
                            'size': file.stat().st_size,
                            'exists': True
                        }
        
        # Scan summary files
        if self.summaries_dir.exists():
            for file in self.summaries_dir.iterdir():
                if file.is_file() and file.suffix.lower() == '.json':
                    match = re.match(r'audio_(\d+)_summary\.json', file.name)
                    if match:
                        audio_id = match.group(1)
                        self._file_cache['summary_files'][audio_id] = {
                            'path': str(file),
                            'name': file.name,
                            'size': file.stat().st_size,
                            'exists': True
                        }
        
        # Build comprehensive mappings
        all_audio_ids = set(self._file_cache['audio_files'].keys()) | \
                       set(self._file_cache['transcript_files'].keys()) | \
                       set(self._file_cache['summary_files'].keys())
        
        for audio_id in all_audio_ids:
            self._file_cache['all_mappings'][audio_id] = {
                'audio': self._file_cache['audio_files'].get(audio_id, {'exists': False}),
                'transcript': self._file_cache['transcript_files'].get(audio_id, {'exists': False}),
                'summary': self._file_cache['summary_files'].get(audio_id, {'exists': False})
            }
    
    def find_audio_by_query(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Find audio file by intelligent query matching
        
        Args:
            query: User query like "audio_1", "podcast 1", "first audio", etc.
            
        Returns:
            Dict with file mappings and status
        """
        self._refresh_cache_if_needed()
        
        # Extract audio ID from various query patterns
        audio_id = self._extract_audio_id(query)
        if not audio_id:
            return None
        
        if audio_id not in self._file_cache['all_mappings']:
            return None
        
        mapping = self._file_cache['all_mappings'][audio_id].copy()
        mapping['audio_id'] = audio_id
        mapping['status'] = self._get_status_summary(mapping)
        
        return mapping
    
    def _extract_audio_id(self, query: str) -> Optional[str]:
        """Extract audio ID from various query patterns"""
        import re
        
        # Direct patterns: "audio_1", "audio 1", "audio1", "1", "podcast 1"
        patterns = [
            r'audio[_\s]+(\d+)',  # Matches "audio_1", "audio 1", "audio  1"
            r'audio(\d+)',        # Matches "audio1"
            r'podcast\s*(\d+)',   # Matches "podcast 1", "podcast1"
            r'episode\s*(\d+)',   # Matches "episode 1", "episode1"
            r'^(\d+)$',           # Matches just "1"
            r'first|1st',
            r'second|2nd',
            r'third|3rd',
            r'fourth|4th',
            r'fifth|5th',
            r'sixth|6th',
            r'seventh|7th',
            r'eighth|8th',
            r'ninth|9th',
            r'tenth|10th'
        ]
        
        query_lower = query.lower().strip()
        
        for pattern in patterns:
            match = re.search(pattern, query_lower)
            if match:
                if pattern in ['first|1st', 'second|2nd', 'third|3rd', 'fourth|4th', 
                              'fifth|5th', 'sixth|6th', 'seventh|7th', 'eighth|8th', 
                              'ninth|9th', 'tenth|10th']:
                    # Convert ordinal to number
                    ordinal_map = {
                        'first': '1', '1st': '1', 'second': '2', '2nd': '2',
                        'third': '3', '3rd': '3', 'fourth': '4', '4th': '4',
                        'fifth': '5', '5th': '5', 'sixth': '6', '6th': '6',
                        'seventh': '7', '7th': '7', 'eighth': '8', '8th': '8',
                        'ninth': '9', '9th': '9', 'tenth': '10', '10th': '10'
                    }
                    return ordinal_map.get(query_lower, '1')
                else:
                    return match.group(1)
        
        return None
    
    def _get_status_summary(self, mapping: Dict[str, Any]) -> str:
        """Get human-readable status summary"""
        has_audio = mapping['audio'].get('exists', False)
        has_transcript = mapping['transcript'].get('exists', False)
        has_summary = mapping['summary'].get('exists', False)
        
        if has_audio and has_transcript and has_summary:
            return "complete"
        elif has_audio and has_transcript:
            return "transcribed"
        elif has_audio:
            return "audio_only"
        elif has_transcript:
            return "transcript_only"
        else:
            return "not_found"
    
    def get_file_paths(self, audio_id: str, file_types: List[str] = None) -> Dict[str, str]:
        """
        Get file paths for specific audio ID and file types
        
        Args:
            audio_id: Audio identifier
            file_types: List of file types to get ('audio', 'transcript', 'summary')
            
        Returns:
            Dict with file paths
        """
        self._refresh_cache_if_needed()
        
        if file_types is None:
            file_types = ['audio', 'transcript', 'summary']
        
        if audio_id not in self._file_cache['all_mappings']:
            return {}
        
        mapping = self._file_cache['all_mappings'][audio_id]
        paths = {}
        
        for file_type in file_types:
            if file_type in mapping and mapping[file_type].get('exists'):
                paths[file_type] = mapping[file_type]['path']
        
        return paths
    
    def list_available_content(self) -> Dict[str, Any]:
        """List all available content with status"""
        self._refresh_cache_if_needed()
        
        available = {
            'complete': [],  # Has audio, transcript, and summary
            'transcribed': [],  # Has audio and transcript
            'audio_only': [],  # Has only audio
            'transcript_only': [],  # Has only transcript
            'summary_only': []  # Has only summary
        }
        
        for audio_id, mapping in self._file_cache['all_mappings'].items():
            status = self._get_status_summary(mapping)
            if status in available:
                available[status].append({
                    'audio_id': audio_id,
                    'mapping': mapping
                })
        
        return available
    
    def ensure_dependencies(self, audio_id: str, required_types: List[str]) -> Dict[str, Any]:
        """
        Ensure all required file types exist, trigger generation if needed
        
        Args:
            audio_id: Audio identifier
            required_types: List of required file types
            
        Returns:
            Dict with status and any actions taken
        """
        self._refresh_cache_if_needed()
        
        if audio_id not in self._file_cache['all_mappings']:
            return {
                'status': 'not_found',
                'message': f'Audio {audio_id} not found',
                'actions_taken': []
            }
        
        mapping = self._file_cache['all_mappings'][audio_id]
        actions_taken = []
        missing_types = []
        
        for file_type in required_types:
            if not mapping[file_type].get('exists'):
                missing_types.append(file_type)
        
        if not missing_types:
            return {
                'status': 'ready',
                'message': 'All dependencies satisfied',
                'actions_taken': actions_taken
            }
        
        # Return what's missing for the orchestrator to handle
        return {
            'status': 'missing_dependencies',
            'message': f'Missing: {", ".join(missing_types)}',
            'missing_types': missing_types,
            'actions_taken': actions_taken
        }
    
    def get_suggested_actions(self, audio_id: str, user_intent: str) -> List[str]:
        """
        Get suggested actions based on user intent and current state
        
        Args:
            audio_id: Audio identifier
            user_intent: What the user wants to do
            
        Returns:
            List of suggested actions
        """
        self._refresh_cache_if_needed()
        
        if audio_id not in self._file_cache['all_mappings']:
            return ['transcribe_audio']
        
        mapping = self._file_cache['all_mappings'][audio_id]
        suggestions = []
        
        if user_intent in ['ask_question', 'qa', 'question']:
            if not mapping['transcript'].get('exists'):
                suggestions.append('transcribe_audio')
            elif not mapping['summary'].get('exists'):
                suggestions.append('generate_summary')
            else:
                suggestions.append('ask_question')
        
        elif user_intent in ['summarize', 'summary']:
            if not mapping['transcript'].get('exists'):
                suggestions.append('transcribe_audio')
            else:
                suggestions.append('generate_summary')
        
        elif user_intent in ['play', 'audio', 'listen']:
            if mapping['audio'].get('exists'):
                suggestions.append('play_audio')
            else:
                suggestions.append('audio_not_found')
        
        return suggestions 