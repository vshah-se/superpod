import requests
import os
from llama_api_client import LlamaAPIClient
from PlayPauseAgent import PlayPauseAgent
from summarization_agent import SummarizationAgent
from qa_agent import QAAgent
from transcription_agent import TranscriptionAgent
import json
import re
import ast
from smart_file_manager import SmartFileManager
from workflow_orchestrator import WorkflowOrchestrator
from typing import Dict, Any

class LlamaNodeConnector:

    def __init__(self):
        self.llama_client = LlamaAPIClient(
            api_key=os.environ.get("LLAMA_API_KEY")
        )
        self.model = "Llama-4-Maverick-17B-128E-Instruct-FP8"
        
        # Initialize smart file management and workflow orchestration
        self.file_manager = SmartFileManager()
        self.workflow_orchestrator = WorkflowOrchestrator()
        
        # Initialize only transcription agent by default
        # self.transcription_agent = TranscriptionAgent()
        print("LlamaNodeConnector initialized with Smart File Manager and Workflow Orchestrator")

    def process_client_request(self, prompt):
        """
        Processes the client request using intelligent workflow orchestration.
        
        Args:
            prompt (str): The input prompt for the Llama model.
        
        Returns:
            dict: The response from the workflow orchestrator or Llama API.
        """
        # First, try to process with workflow orchestrator for intelligent handling
        try:
            workflow_result = self.workflow_orchestrator.process_user_request(prompt)
            
            # If workflow orchestrator successfully handled the request
            if workflow_result['status'] == 'success':
                return {
                    'status': 'success',
                    'source': 'workflow_orchestrator',
                    'result': workflow_result
                }
            
            # If workflow orchestrator couldn't handle it, fall back to Llama API
            elif workflow_result['status'] == 'error' and 'Could not find audio' in workflow_result.get('message', ''):
                # This is a general query that should go to Llama API
                return self._process_with_llama_api(prompt)
            
            else:
                # Return workflow error
                return {
                    'status': 'error',
                    'source': 'workflow_orchestrator',
                    'message': workflow_result.get('message', 'Unknown error'),
                    'suggestions': workflow_result.get('suggestions', [])
                }
                
        except Exception as e:
            # Fall back to Llama API if workflow orchestrator fails
            print(f"Workflow orchestrator failed, falling back to Llama API: {e}")
            return self._process_with_llama_api(prompt)

    def process_with_llama_api(self, prompt):
        """Process request with Llama API for general queries"""
        llama_response = self.llama_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that looks at user message and categorize it in one of the following categories: 'summarization', 'question_answering', 'audio_playback'. If the user message is about audio playback, you will call the PausePlayAgent to find and play the audio." +
                    "You will return the response in JSON format with keys 'category' and 'response'. Remove special charachters from parameters on tool calls. " 
                },
                {
                    "role": "user", 
                    "content": str(prompt)
                 }
                ],
            model=self.model,
            stream=False,
            temperature=0.6,
            max_completion_tokens=2048,
            top_p=0.9,
            repetition_penalty=1,
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "call_pause_play_agent",
                        "description": "Retrieve the current temperature for a specified location",
                        "parameters": {
                        "properties": {
                            "audioid": {
                            "type": "string",
                            "description": "audio file name"
                            },
                             "user_message": {
                            "type": "string",
                            "description": "user message"
                            }
                        },
                        "required": ["audioid","user_message"]
                        }
                    }
                },
                 {
                    "type": "function",
                    "function": {
                        "name": "call_summarization_agent",
                        "description": "Generate summaries of podcast transcripts",
                        "parameters": {
                        "properties": {
                            "transcript_file": {
                            "type": "string",
                            "description": "Path to the transcript file to summarize."
                            }
                        },
                        "required": ["transcript_file"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "call_qa_agent",
                        "description": "Answer questions about podcast content",
                        "parameters": {
                        "properties": {
                            "question": {
                            "type": "string",
                            "description": "Question to ask about the podcast."
                            }
                        },
                        "required": ["question","transcript_file"]
                        }
                    }
                },
        ],
        )

         # Parse the response string to dict
        try:
            response_str = llama_response.completion_message.content.text.replace("'", "\"")
            response = json.loads(response_str)
        except Exception as e:
            print(f"Error parsing response: {e}")
            fixed = self.fix_llm_json(response_str)
            try:
                response = json.loads(fixed)
            except Exception as e2:
                print(f"Error parsing fixed response: {e2}")
                # fallback logic
                response = {"category": "unknown", "response": response_str}
                

        # Tool calling logic
        if response.get("category") == "audio_playback" and isinstance(response.get("response"), list):
            # Example: [call_pause_play_agent(location="audio_1", user_message="...")]
            tool_call = response["response"][0]
            match = re.match(r'call_pause_play_agent\((.*)\)', tool_call)
            if match:
                args_str = match.group(1)
                 # Use shlex to split arguments safely
                args = {}
                audioid_match = re.search(r'audioid\s*=\s*"([^"]+)"', args_str)
                user_message_match = re.search(r'user_message\s*=\s*"([^"]+)"', args_str)
                audioid = audioid_match.group(1) if audioid_match else None
                user_message = user_message_match.group(1) if user_message_match else None

                
                tool_result = self.call_pause_play_agent(
                    audioid=audioid,
                    user_message=user_message
                )
                return tool_result
        
        elif response.get("category") == "summarization" and isinstance(response.get("response"), list):
            tool_call = response["response"][0]
            match = re.match(r'call_summarization_agent\((.*)\)', tool_call)
            if match:
                args_str = match.group(1)
                args = {}
                for arg in args_str.split(","):
                    k, v = arg.split("=", 1)
                    args[k.strip()] = v.strip().strip('"').strip("'")
                tool_result = self.call_summarization_agent(
                    transcript_file=args.get("transcript_file"),
                    output_dir=""
                )
                return tool_result

        elif response.get("category") == "question_answering" and isinstance(response.get("response"), list):
            tool_call = response["response"][0]
            match = re.match(r'call_qa_agent\((.*)\)', tool_call)
            if match:
                args_str = match.group(1)
                args = {}
                for arg in args_str.split(","):
                    k, v = arg.split("=", 1)
                    args[k.strip()] = v.strip().strip('"').strip("'")
                tool_result = self.call_qa_agent(
                    question=args.get("question"),
                    transcript_file=args.get("transcript_file"),
                    summary_file=args.get("summary_file")
                )
                return tool_result

        return response

    def call_transcription_agent(self, audio_file_path, output_dir):
        """
        Calls the TranscriptionAgent with the given parameters.
        
        Args:
            audio_file_path (str): Path to the audio file.
            output_dir (str): Directory to save the transcript.
        
        Returns:
            dict: The response from the TranscriptionAgent.
        """
        # Using the workflow orchestrator's transcription agent
        success =  self.workflow_orchestrator.transcription_agent.process(audio_file_path, output_dir)
        if success:
            return {
                "status": "success",
                "message": f"Successfully transcribed {audio_file_path}",
                "output_dir": output_dir
            }
        else:
            return {
                "status": "error",
                "message": f"Failed to transcribe {audio_file_path}"
            }

    def call_pause_play_agent(self, audioid, user_message):
        """
        Calls the PausePlayAgent with the given prompt.
        
        Args:
            prompt (str): The input prompt for the PausePlayAgent.
        
        Returns:
            dict: The response from the PausePlayAgent.
        """
        # Create new instance when called
        playpauseagent = PlayPauseAgent()
        return playpauseagent.find_and_play_audio(self.llama_client, audioid, user_message)

    def call_summarization_agent(self, transcript_file, output_dir):
        """
        Calls the SummarizationAgent with the given prompt.
        
        Args:
            prompt (str): The input prompt for the SummarizationAgent.
        
        Returns:
            dict: The response from the SummarizationAgent.
        """
        # Using the workflow orchestrator's summarization agent
        return self.workflow_orchestrator.summarization_agent.process(transcript_file, output_dir)
        
    def call_qa_agent(self, question, transcript_file, summary_file):

        """
        Calls the QAAgent with the given prompt.
        
        Args:
            prompt (str): The input prompt for the QAAgent.
        
        Returns:
            dict: The response from the QAAgent.
        """
        # Create new instance when called
    
        # Using the workflow orchestrator's QA agent
        success = self.workflow_orchestrator.qa_agent.load_data(transcript_file, summary_file)
        if success:
            answer = self.workflow_orchestrator.qa_agent.ask_question(question)
            return {
                "status": "success",
                "question": question,
                "answer": answer
            }
        else:
            return {
                "status": "error",
                "message": "Failed to load data for Q&A"
            }
    def fix_llm_json(self, json_str):
        # Replace single quotes with double quotes
        fixed = json_str.replace("'", '"')

        # Quote function calls in arrays
        def quote_func_call(match):
            func_call = match.group(2)
            # Escape inner double quotes inside the function call
            func_call = re.sub(r'(?<!\\)"', r'\\"', func_call)
            return f'["{func_call}"]'

        fixed = re.sub(r'(\[)(\s*call_\w+\(.*?\)\s*)(\])', quote_func_call, fixed)

        return fixed
    def get_system_status(self):
        """
        Get comprehensive system status including file availability and workflow status.
        
        Returns:
            dict: System status information
        """
        return self.workflow_orchestrator.get_system_status()

    def list_available_content(self):
        """
        List all available content with their processing status.
        
        Returns:
            dict: Available content breakdown
        """
        return self.file_manager.list_available_content()

    def process_smart_request(self, user_query):
        """
        Process user request with intelligent message processing and automatic dependency resolution.
        
        Args:
            user_query (str): User's query or request
            
        Returns:
            dict: Processed result with workflow information
        """
        return self.workflow_orchestrator.process_user_request(user_query)

    def process_message_based_request(self, user_message: str) -> Dict[str, Any]:
        """
        Process user message using the new message-based architecture
        
        Args:
            user_message: User's input message
            
        Returns:
            Dict with processed result
        """
        try:
            # Use the workflow orchestrator with message processing
            result = self.workflow_orchestrator.process_user_request(user_message)
            
            # Add source information
            result['source'] = 'message_processor'
            result['processed_message'] = user_message
            
            return result
            
        except Exception as e:
            return {
                'status': 'error',
                'source': 'message_processor',
                'message': f'Error processing message: {str(e)}',
                'processed_message': user_message
            }
