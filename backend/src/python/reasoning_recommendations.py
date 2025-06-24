"""
Reasoning-Based Recommendation System
Advanced recommendation engine using Llama4 for sophisticated content analysis and reasoning
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import os

from LlamaNodeConnector import LlamaNodeConnector

class ReasoningRecommendationEngine:
    """Advanced recommendation engine with sophisticated reasoning capabilities"""
    
    def __init__(self):
        self.llama_connector = LlamaNodeConnector()
        self.logger = self._setup_logger()
        
        # Set up directories
        self.transcriptions_dir = Path(__file__).parent / "transcriptions"
        self.summaries_dir = Path(__file__).parent / "summaries"
        self.recommendations_dir = Path(__file__).parent / "recommendations"
        
    def _setup_logger(self) -> logging.Logger:
        """Set up logging"""
        logger = logging.getLogger("ReasoningRecommendations")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def analyze_content_deeply(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform deep content analysis using advanced reasoning
        
        Args:
            transcript_data: Transcript data with text and segments
            
        Returns:
            Comprehensive content analysis
        """
        try:
            self.logger.info("Starting deep content analysis...")
            
            text = transcript_data.get('text', '')
            
            # Advanced content analysis prompt
            analysis_prompt = f"""
            You are an expert content analyst specializing in podcast and media content. Analyze the following transcript with sophisticated reasoning to extract deep insights.

            TRANSCRIPT:
            {text}

            Provide a comprehensive analysis in JSON format with the following structure:

            {{
                "content_analysis": {{
                    "primary_theme": "main overarching theme",
                    "secondary_themes": ["theme1", "theme2", "theme3"],
                    "content_depth": "surface/intermediate/deep",
                    "expertise_level": "beginner/intermediate/advanced/expert",
                    "discussion_style": "conversational/educational/debate/interview/monologue",
                    "emotional_tone": "neutral/enthusiastic/serious/humorous/inspirational/critical",
                    "key_concepts": ["concept1", "concept2", "concept3"],
                    "practical_value": "theoretical/practical/mixed",
                    "controversy_level": "none/low/medium/high"
                }},
                "audience_analysis": {{
                    "target_demographic": "specific audience description",
                    "prerequisite_knowledge": "what audience should know beforehand",
                    "interest_indicators": ["what suggests audience interest"],
                    "engagement_factors": ["what keeps audience engaged"]
                }},
                "content_quality": {{
                    "information_density": "low/medium/high",
                    "narrative_structure": "description of how content flows",
                    "credibility_indicators": ["sources, expertise mentioned"],
                    "unique_insights": ["novel or unique points made"],
                    "actionable_takeaways": ["specific actions audience can take"]
                }},
                "reasoning_analysis": {{
                    "logical_flow": "how well ideas connect",
                    "evidence_quality": "strength of supporting evidence",
                    "argument_structure": "how arguments are presented",
                    "critical_thinking": "level of analytical depth",
                    "perspective_diversity": "range of viewpoints presented"
                }},
                "recommendation_factors": {{
                    "similarity_keywords": ["terms for finding similar content"],
                    "complementary_topics": ["related but different topics"],
                    "skill_progression": "next level content suggestions",
                    "cross_domain_connections": ["connections to other fields"],
                    "temporal_relevance": "how time-sensitive this content is"
                }}
            }}

            Return only valid JSON, no additional text.
            """
            
            # Get analysis from Llama4
            response = self.llama_connector.process_client_request(analysis_prompt)
            
            # Parse response
            if isinstance(response, dict) and 'result' in response:
                analysis_text = response['result'].get('answer', str(response))
            else:
                analysis_text = str(response)
            
            # Try to parse JSON response
            try:
                analysis = json.loads(analysis_text)
                self.logger.info("Deep content analysis completed successfully")
                return analysis
            except json.JSONDecodeError:
                self.logger.warning("Failed to parse analysis JSON, using fallback")
                return self._create_fallback_analysis(transcript_data)
                
        except Exception as e:
            self.logger.error(f"Error in deep content analysis: {e}")
            return self._create_fallback_analysis(transcript_data)
    
    def generate_reasoning_based_recommendations(
        self, 
        analysis: Dict[str, Any], 
        available_content: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate sophisticated recommendations based on deep analysis
        
        Args:
            analysis: Deep content analysis
            available_content: List of available content for recommendations
            
        Returns:
            Sophisticated recommendation set
        """
        try:
            self.logger.info("Generating reasoning-based recommendations...")
            
            # If no available content provided, use existing transcripts
            if not available_content:
                available_content = self._get_available_content()
            
            # Create sophisticated recommendation prompt
            recommendation_prompt = f"""
            You are an expert recommendation system with advanced reasoning capabilities. Based on the deep content analysis, generate sophisticated recommendations.

            CONTENT ANALYSIS:
            {json.dumps(analysis, indent=2)}

            AVAILABLE CONTENT:
            {json.dumps(available_content[:10], indent=2)}  # Limit for prompt size

            Generate recommendations using advanced reasoning in JSON format:

            {{
                "reasoning_based_recommendations": {{
                    "direct_matches": [
                        {{
                            "content_id": "id",
                            "title": "title",
                            "reasoning": "detailed explanation of why this matches",
                            "match_strength": "high/medium/low",
                            "matching_factors": ["specific factors that match"],
                            "confidence_score": 0.95
                        }}
                    ],
                    "complementary_content": [
                        {{
                            "content_id": "id", 
                            "title": "title",
                            "reasoning": "why this complements the original",
                            "complement_type": "prerequisite/follow-up/alternative_perspective/deeper_dive",
                            "learning_progression": "how this fits in learning journey"
                        }}
                    ],
                    "contrasting_perspectives": [
                        {{
                            "content_id": "id",
                            "title": "title", 
                            "reasoning": "why this provides valuable contrast",
                            "contrast_value": "challenges assumptions/provides balance/offers debate"
                        }}
                    ]
                }},
                "personalized_paths": {{
                    "beginner_path": ["ordered content for beginners"],
                    "intermediate_path": ["content for those with some knowledge"],
                    "expert_path": ["advanced content for experts"],
                    "practical_path": ["hands-on, actionable content"],
                    "theoretical_path": ["conceptual, theoretical content"]
                }},
                "cross_domain_suggestions": {{
                    "related_fields": ["fields that connect to this content"],
                    "interdisciplinary_connections": ["how this connects to other domains"],
                    "skill_transfer_opportunities": ["skills from this content applicable elsewhere"]
                }},
                "reasoning_explanation": {{
                    "recommendation_logic": "overall logic behind recommendations",
                    "weighting_factors": "what factors were most important",
                    "edge_cases_considered": ["special considerations made"],
                    "confidence_rationale": "why we're confident in these recommendations"
                }}
            }}

            Return only valid JSON, no additional text.
            """
            
            # Get recommendations from Llama4
            response = self.llama_connector.process_client_request(recommendation_prompt)
            
            # Parse response
            if isinstance(response, dict) and 'result' in response:
                recommendations_text = response['result'].get('answer', str(response))
            else:
                recommendations_text = str(response)
            
            # Try to parse JSON response
            try:
                recommendations = json.loads(recommendations_text)
                self.logger.info("Reasoning-based recommendations generated successfully")
                return recommendations
            except json.JSONDecodeError:
                self.logger.warning("Failed to parse recommendations JSON, using fallback")
                return self._create_fallback_recommendations(analysis)
                
        except Exception as e:
            self.logger.error(f"Error generating reasoning-based recommendations: {e}")
            return self._create_fallback_recommendations(analysis)
    
    def generate_complete_recommendation_report(
        self, 
        transcript_data: Dict[str, Any],
        pipeline_id: str
    ) -> Dict[str, Any]:
        """
        Generate a complete recommendation report with deep analysis
        
        Args:
            transcript_data: Original transcript data
            pipeline_id: Pipeline identifier
            
        Returns:
            Complete recommendation report
        """
        try:
            self.logger.info(f"Generating complete recommendation report for {pipeline_id}")
            
            # Step 1: Deep content analysis
            analysis = self.analyze_content_deeply(transcript_data)
            
            # Step 2: Generate reasoning-based recommendations
            recommendations = self.generate_reasoning_based_recommendations(analysis)
            
            # Step 3: Create complete report
            complete_report = {
                'pipeline_id': pipeline_id,
                'timestamp': datetime.now().isoformat(),
                'original_transcript_info': {
                    'text_length': len(transcript_data.get('text', '')),
                    'segments_count': len(transcript_data.get('segments', [])),
                    'language': transcript_data.get('language', 'unknown')
                },
                'deep_analysis': analysis,
                'reasoning_recommendations': recommendations,
                'report_metadata': {
                    'analysis_version': '2.0',
                    'reasoning_engine': 'Llama4-Advanced',
                    'confidence_level': 'high'
                }
            }
            
            # Save complete report
            report_file = self.recommendations_dir / f"{pipeline_id}_reasoning_recommendations.json"
            with open(report_file, 'w') as f:
                json.dump(complete_report, f, indent=2)
            
            self.logger.info(f"Complete recommendation report saved to {report_file}")
            return complete_report
            
        except Exception as e:
            self.logger.error(f"Error generating complete recommendation report: {e}")
            return self._create_fallback_report(transcript_data, pipeline_id)
    
    def _get_available_content(self) -> List[Dict[str, Any]]:
        """Get list of available content for recommendations"""
        content = []
        
        # Get existing transcripts
        if self.transcriptions_dir.exists():
            for transcript_file in self.transcriptions_dir.glob("*_transcript.json"):
                try:
                    with open(transcript_file, 'r') as f:
                        data = json.load(f)
                        content.append({
                            'content_id': transcript_file.stem.replace('_transcript', ''),
                            'title': f"Content {transcript_file.stem}",
                            'text_preview': data.get('text', '')[:200],
                            'language': data.get('language', 'unknown'),
                            'segments_count': len(data.get('segments', []))
                        })
                except Exception as e:
                    self.logger.warning(f"Error loading {transcript_file}: {e}")
        
        return content
    
    def _create_fallback_analysis(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create fallback analysis if AI analysis fails"""
        text = transcript_data.get('text', '')
        word_count = len(text.split())
        
        return {
            'content_analysis': {
                'primary_theme': 'general discussion',
                'content_depth': 'intermediate' if word_count > 500 else 'surface',
                'expertise_level': 'intermediate',
                'discussion_style': 'conversational',
                'emotional_tone': 'neutral'
            },
            'audience_analysis': {
                'target_demographic': 'general audience',
                'prerequisite_knowledge': 'basic understanding of topic'
            },
            'content_quality': {
                'information_density': 'medium',
                'narrative_structure': 'sequential discussion'
            },
            'fallback_analysis': True
        }
    
    def _create_fallback_recommendations(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Create fallback recommendations if AI recommendations fail"""
        return {
            'reasoning_based_recommendations': {
                'direct_matches': [],
                'complementary_content': [],
                'contrasting_perspectives': []
            },
            'personalized_paths': {
                'beginner_path': ['Start with basic concepts'],
                'intermediate_path': ['Build on existing knowledge'],
                'expert_path': ['Explore advanced topics']
            },
            'fallback_recommendations': True
        }
    
    def _create_fallback_report(self, transcript_data: Dict[str, Any], pipeline_id: str) -> Dict[str, Any]:
        """Create fallback report if complete analysis fails"""
        return {
            'pipeline_id': pipeline_id,
            'timestamp': datetime.now().isoformat(),
            'deep_analysis': self._create_fallback_analysis(transcript_data),
            'reasoning_recommendations': self._create_fallback_recommendations({}),
            'fallback_report': True
        } 