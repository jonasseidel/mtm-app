from google import genai
from google.genai import types

class GeminiModel:
    def __init__(self, system_prompt: str = "Du bist eine katze und kennst nur miau", model_name: str = "gemini-2.0-flash"):

        self.client = genai.Client(api_key="REMOVED")

        self.system_prompt = system_prompt

        self.new_chat("gemini-2.0-flash")

    def new_chat(self, model_name: str):
        """Creates new chat session."""
        self.chat = self.client.chats.create(
            model= model_name,
            config = types.GenerateContentConfig(
                system_instruction= self.system_prompt
            )
        )
        
    def gen(self, prompt: str):
        try:
            response = self.chat.send_message(prompt)
            return response.text
        except Exception:
            return "Error: Unable to process the request."

    def gen_stream(self, prompt: str):
        response = self.chat.send_message_stream(prompt)
        return response
        
