from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from gemini_model import GeminiModel

import asyncio
import os


def _read_system_prompt(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"Fehler beim Lesen von {path}: {e}")
        return None

model = GeminiModel(system_prompt=_read_system_prompt("sys_prompt.txt"))

app = FastAPI()
os.makedirs("static/charts", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class Message(BaseModel):
    prompt: str
    session_id: str

@app.post("/chat")
async def chat(message: Message):
    if not model.is_session(message.session_id):
        model.create_session(message.session_id)
        print(f"Created new session with id {message.session_id}")
    
    res = model.gen(message.session_id, message.prompt)
    return {"response": res}

@app.post("/chat/stream")
async def chat_stream(message: Message):
    if not model.is_session(message.session_id):
        model.create_session(message.session_id)
        print(f"Created new session with id {message.session_id}")

    async def event_generator():
        retries = 5
        for attempt in range(retries):
            try:
                for chunk in model.gen_stream(message.session_id, message.prompt):
                    if chunk.text is not None:
                        #print("Chunk:", chunk.text)
                        yield chunk.text
                if model.is_pending_image(message.session_id):
                    image = model.get_pending_image(message.session_id)
                    model.pending_images.pop(message.session_id, None)  # Remove the pending image after retrieving it
                    print(f"Returning pending image for session {message.session_id}")
                    yield f"\x00IMAGE_URL:{image}\x00"
                return
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt < retries - 1:
                    yield "\x00RETRY\x00"
                    await asyncio.sleep(2 ** attempt)
                else:
                    yield "\x00ERROR\x00"

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.post("/reset")
async def reset(message: Message): # TODO needs session_id to only reset that session
    if model.is_session(message.session_id):
        model.delete_session(message.session_id)
    model.create_session(message.session_id)
    return {"success": True, "message": "Model has been reset."}
