from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemini_model import GeminiModel

import asyncio


def _read_system_prompt(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"Fehler beim Lesen von {path}: {e}")
        return None

model = GeminiModel(system_prompt=_read_system_prompt("sys_prompt.txt"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class Message(BaseModel):
    prompt: str

@app.post("/chat")
async def chat(message: Message):
    res = model.gen(message.prompt)
    return {"response": res}

@app.post("/chat/stream")
async def chat_stream(message: Message):
    async def event_generator():
        retries = 5
        for attempt in range(retries):
            try:
                for chunk in model.gen_stream(message.prompt):
                    if chunk.text is not None:
                        #print("Chunk:", chunk.text)
                        yield chunk.text
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
async def reset():
    model.new_chat()
    return {"success": True, "message": "Model has been reset."}
