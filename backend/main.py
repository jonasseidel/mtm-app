from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemini_model import GeminiModel


def _read_system_prompt(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"Fehler beim Lesen von {path}: {e}")
        return None

model = GeminiModel(system_prompt=_read_system_prompt("sys_prompt.txt"))

app = FastAPI()
print("Hey")
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

@app.post("/reset")
async def reset():
    model.new_chat("gemini-2.0-flash")
    return {"success": True, "message": "Model has been reset."}
