import requests
import os
from llama_api_client import LlamaAPIClient
from chromadb.config import Settings
import json


class PlayPauseAgent:

    def find_and_play_audio(self, llama_client, audioid, user_message):
        """
        Finds and plays an audio based on the provided query.
        
        Args:
            query (str): The search query for the audio.
        
        Returns:
            dict: The response containing audio details or an error message.
        """
        # Placeholder for actual implementation
        # Search for transcript file in transcriptions folder
        transcriptions_dir = os.path.join(os.path.dirname(__file__), "transcriptions")
        transcript_file = None
        for fname in os.listdir(transcriptions_dir):
            if audioid in fname:
                transcript_file = os.path.join(transcriptions_dir, fname)
                break

        if not transcript_file or not os.path.isfile(transcript_file):
            return {"status": "error", "message": f"Transcript for audioid {audioid} not found"}

        # Load audio segments from the transcript file (assuming JSON format)
        with open(transcript_file, "r") as f:
            audio_segments = json.load(f)

        llama_response = llama_client.chat.completions.create(
            messages=[{
                "role": "system",
                "content": "You are a helpful assistant that finds and plays audio based on user queries. You find all matching segments based on user queries and return all of them."
            },
            {
                "role": "user", 
                "content": "Look at all the audio segments and find segments matching user queyr: " + user_message + 
                "From all segments extract - start_s and end_s. return earliest start_s and latest end_s." +
                "Here is the transcript of audio file with segments: " + json.dumps(audio_segments)  
            }],
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            stream=False,
            temperature=0.6,
            max_completion_tokens=2048,
            top_p=0.9,
            repetition_penalty=1,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "json_schema",
                    "schema": {
                        "properties": {
                            "message": {
                                "type": "string"
                            },
                            "start_s": {
                                "type": "string"
                            },
                            "end_s": {
                                "type": "string"
                            }
                        },
                        "required": [
                            "message",
                            "start_s",
                            "end_s"
                        ],
                        "type": "object"
                    }
                },
                },
        )
        return llama_response.completion_message.content.text