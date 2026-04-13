import { useState, useEffect, useRef} from "react";
import ChatWindowDisplay from "./ChatWindowDisplay";
import EnterPromptField from "./EnterPromptField";

function ChatWindow() {
    //Maybe via an argument/Props later?
    //const initialMessage: [string, number][] = [["Hallo! Ich bin dein Moor-Experte. Was möchtest du über Moore wissen?",0]]
    const [messages, setMessages] = useState<[string, number][]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const skipTyping = useRef(false);
    const retrySignal = useRef(false);
    let streamEnabled = true;
    
    useEffect(() => {
        console.log("Ask model to greet user");
        introduceModel();
    }, []);
    
    const introduceModel = async () => {
        setMessages([]);
        if (streamEnabled){
            generateResponseStream("Bitte Grüße den Nutzer und stelle dich vor. Nur ganz kurz!"); // Maybe via argument/props later?
        } else{
            generateResponse("Bitte Grüße den Nutzer und stelle dich vor. Nur ganz kurz!"); // Maybe via argument/props later?
        }
    };

    const generateResponse = async (message: string) => {
        try{

            console.log("Awaiting response to", message);
            const res = await fetch('http://localhost:8000/chat',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({prompt: message})
                }
            );
            console.log("Response received")
            const data = await res.json();
            setMessages(prevMessages => [...prevMessages, [data.response,0]]);

        } catch (error) {
            console.error("Error fetching response")
        }

        await delay(5);
        scroll();
    }


    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSend = async (value: string) => {

        setMessages(prevMessages => [...prevMessages, [value,1]]);
        await delay(5);

        scroll();

        if (streamEnabled){
            await generateResponseStream(value);
        } else{
            await generateResponse(value);
        }
    }

    const scroll = () => {
        window.scrollTo({
            top: Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            ),
            behavior: 'smooth',
        });
    }

    const generateResponseStream = async (value : string) => {

        skipTyping.current = false;
        retrySignal.current = false;
        setIsStreaming(false);
        setMessages(prevMessages => [...prevMessages, ["",0]]);

        const queue: string[] = [];
        const state = { apiDone: false };

        // Producer: reads chunks from API and pushes to queue
        const produce = async () => {
            try {
                const res = await fetch("http://localhost:8000/chat/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: value }),
                });
                if (!res.ok) throw new Error("Network response was not ok");
                if (!res.body) throw new Error("Response body is null");

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let done = false;

                while (!done) {
                    const { value: raw, done: doneReading } = await reader.read();
                    done = doneReading;
                    if (raw) {
                        const chunk = decoder.decode(raw, { stream: true });
                        if (chunk.includes("\x00RETRY\x00")) {
                            retrySignal.current = true;
                            queue.length = 0;
                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = ["", updated[updated.length - 1][1]];
                                return updated;
                            });
                        } else {
                            queue.push(chunk);
                        }
                    }
                }
                console.log("Done reading!");
            } catch (error) {
                console.log("Could not get full response");
                queue.push("\x00ERROR\x00");
            }
            state.apiDone = true;
            setIsStreaming(true); // API done → show skip button
        };

        // Consumer: animates text from queue character by character
        const consume = async () => {
            while (!state.apiDone || queue.length > 0) {
                if (retrySignal.current) {
                    retrySignal.current = false;
                    continue;
                }

                if (queue.length === 0) {
                    await delay(10);
                    continue;
                }

                const chunk = queue.shift()!;

                if (skipTyping.current) {
                    setMessages(prev => {
                        const updated = [...prev];
                        const [text, flag] = updated[updated.length - 1];
                        updated[updated.length - 1] = [text + chunk, flag];
                        return updated;
                    });
                    continue;
                }

                for (let i = 0; i < chunk.length; i++) {
                    if (retrySignal.current) break;
                    if (skipTyping.current) {
                        setMessages(prev => {
                            const updated = [...prev];
                            const [text, flag] = updated[updated.length - 1];
                            updated[updated.length - 1] = [text + chunk.slice(i), flag];
                            return updated;
                        });
                        break;
                    }
                    setMessages(prev => {
                        const updated = [...prev];
                        const [text, flag] = updated[updated.length - 1];
                        updated[updated.length - 1] = [text + chunk[i], flag];
                        return updated;
                    });
                    await delay(7);
                    scroll();
                }
            }
        };

        produce(); // fire and forget — runs in parallel
        await consume(); // wait for animation to finish

        setIsStreaming(false);

        // If the backend signalled an error, show a red error bubble
        setMessages(prev => {
            if (prev.length === 0) return prev;
            const lastText = prev[prev.length - 1][0];
            if (lastText.includes("\x00ERROR\x00")) {
                const updated = [...prev];
                updated[updated.length - 1] = ["High demand of the model (API Error)", 2];
                return updated;
            }
            return prev;
        });

        await delay(5);
        scroll();
    }


    const handleReset = async () => {
        try {
            const res = await fetch("http://localhost:8000/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }
            );
            const data = await res.json();
            if (data.success){
                setMessages([]);
                
                await delay(5);
                introduceModel();
                await delay(1500);
                console.log("Chat reset successfull!")
            } else {
                console.log("Chat reset unsuccessfull!")
            }
        } catch (error) {
            console.error("Error resetting model")
        }
    }

    return (
        <div className="vstack gap-3 p-2">       
            <ChatWindowDisplay messages={messages} isStreaming={isStreaming} onSkip={() => { skipTyping.current = true; }}/>
            <div className="bg-white w-50 fixed-bottom mx-auto">
                <div className="invisible">
                    Empty
                </div>
            </div>
            <EnterPromptField onSend={handleSend} onReset={handleReset}/>
        </div>
    );
}

export default ChatWindow;