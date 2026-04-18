from google import genai
from google.genai import types, chats
import tools
import traceback
import time
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

# loading api key from .env file
load_dotenv()

class GeminiModel:
    def __init__(self, system_prompt: str = "Du bist eine katze und kennst nur miau", model_name: str = "gemini-2.5-flash"):

        if not os.getenv("GEMINI_API_KEY"):
            raise ValueError("Environment variable 'GEMINI_API_KEY' is not set. Create a .env file with GEMINI_API_KEY=your_api_key_here")
        
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

        # give model current date so it can use the tools to query for current readings and stats better.
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.system_prompt = system_prompt + f"\n\nHeute ist der {today}."

        self.model_name = model_name
        self.tools = [
            tools.getCurrentReadings,
            tools.getHistoricalStats,
            tools.getExtremeReading,
            tools.getTrend
        ]

        self.sessions: dict[str, genai.chats.Chat] = {}

        # Configure function calling mode
        #For some reason the model does not stop calling functions, so we disable it for now
        '''self.tool_config = types.ToolConfig(
            function_calling_config=types.FunctionCallingConfig(
                mode="ANY"
            )
        )'''
        # self.new_chat()

    def create_session(self, session_id: str):
        "Create new Session with given id. If already exists, throws error."
        if session_id not in self.sessions:
            self.sessions[session_id] = self.client.chats.create(
                model=self.model_name,
                config = types.GenerateContentConfig(
                    system_instruction = self.system_prompt,
                    tools = self.tools,
                    #tool_config = self.tool_config,
                    temperature=0.0,
                    thinking_config=types.ThinkingConfig(thinking_budget=0)
                )
            )
        else:
           raise ValueError(f"Session with id {session_id} already exists.")
        
    def get_session(self, session_id: str):
        "Get session by id. If not exists, throws error."
        if session_id in self.sessions:
            return self.sessions[session_id]
        else:
            raise ValueError(f"Session with id {session_id} does not exist.")

    def is_session(self, session_id: str):
        "Check if session with id exists."
        return session_id in self.sessions
    
    # def new_chat(self, model_name: str = None):
    #     """Creates new chat session."""
    #     if model_name:
    #         self.model_name = model_name
    #     self.chat = self.client.chats.create(
    #         model=self.model_name,
    #         config = types.GenerateContentConfig(
    #             system_instruction = self.system_prompt,
    #             tools = self.tools,
    #             #tool_config = self.tool_config,
    #             temperature=0.0,
    #             thinking_config=types.ThinkingConfig(thinking_budget=0)
    #         )
    #     )
        
    def gen(self, session_id: str, prompt: str, retries: int = 7):
        chat = self.get_session(session_id)
        for attempt in range(retries):
            try:
                response = chat.send_message(prompt)
                return response.text
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # 1s, 2s, 4s
                else:
                    print("Max retries exceeded.")
                    return "Error: Unable to process the request."

    def gen_stream(self, session_id: str, prompt: str):
        chat = self.get_session(session_id)
        return chat.send_message_stream(prompt)

    def print_chat_history(self, session_id: str):
        chat = self.get_session(session_id)
        for i, msg in enumerate(chat.get_history()):
            role = msg.role
            content = msg.parts[0].text if msg.parts else "<no content>"
            print(f"[{i}] {role.upper()}: {content}")
        
