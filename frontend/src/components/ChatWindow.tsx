import { useState, useEffect} from "react";
import ChatWindowDisplay from "./ChatWindowDisplay";
import EnterPromptField from "./EnterPromptField";

function ChatWindow() {
    //Maybe via an argument/Props later?
    //const initialMessage: [string, number][] = [["Hallo! Ich bin dein Moor-Experte. Was möchtest du über Moore wissen?",0]]
    const [messages, setMessages] = useState<[string, number][]>([]);
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
        
        setMessages(prevMessages => [...prevMessages, ["",0]]);
        try{
            const res = await fetch("http://localhost:8000/chat/stream",
                {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    },
                body: JSON.stringify({ prompt: value }),
                });
            if (!res.ok) {
                throw new Error("Network response was not ok: "+  res.body);
            }else {console.log("Response was okay")}
            if (!res.body) {
                throw new Error("Response body is null");
            }else {console.log("Body not null")}

            const reader = res.body.getReader();
            const decoder = new TextDecoder();               // Decode binary stream to text
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                await delay(50);
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    for(const char of chunk){
                        setMessages(prev => {
                        const updated = [...prev];
                        const [text, flag] = updated[updated.length - 1];
                        updated[updated.length - 1] = [text + char, flag];
                        return updated;
                        });
                        await delay(15);
                    }
                    
                }
                scroll();
            }
            console.log("Done reading!")
        } catch (error) {
            console.log("Could not get full response")
            setMessages(prev => {
                        const updated = [...prev];
                        const [text, flag] = updated[updated.length - 1];
                        updated[updated.length - 1] = [text + " ... Error", flag];
                        return updated;
                    });
        }

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
            <ChatWindowDisplay messages={messages} />
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