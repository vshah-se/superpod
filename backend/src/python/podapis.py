from flask import Flask, request, jsonify
from LlamaNodeConnector import LlamaNodeConnector as llama_node_connector
import json

class PodAPIs:
    def __init__(self):
        self.app = Flask(__name__)
        self.setup_routes()

    def setup_routes(self):
               # Chat Endpoints
        @self.app.route('/chat/message', methods=['POST'])
        def chat_message():
            data = request.json
            llama_node_connector_instance = llama_node_connector()
            response = llama_node_connector_instance.process_with_llama_api(data)
            if isinstance(response, str):
                try:
                    response = json.loads(response)
                except Exception:
                    pass
            return jsonify(response)

    def run(self, host='0.0.0.0', port=50000):
        self.app.run(host=host, port=port)

if __name__ == "__main__":
    pod_apis = PodAPIs()
    pod_apis.run()