import { useState, useEffect} from "react";
import ChatWindowDisplay from "./ChatWindowDisplay";
import EnterPromptField from "./EnterPromptField";

function ChatWindow() {
    //Maybe via an argument/Props later?
    const initialMessage: [string, number][] = [["Hallo! Ich bin dein Moor-Experte. Was möchtest du über Moore wissen?",0]]
    const [messages, setMessages] = useState<[string, number][]>([]);

    useEffect(() => {
        console.log("Ask model to greet user");
        introduceModel();
    }, []);
    
    const introduceModel = async () => {
        const res = await generateResponse("Bitte Grüße den Nutzer und stelle dich vor. Nur ganz kurz!"); // Maybe via argument/props later?
        console.log(res)
        setMessages([[res,0]]);
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
            return data.response;
        } catch (error) {
            console.error("Error fetching response")
            return "Error"
        }
        
    }
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSend = async (value: string) => {
        setMessages(prevMessages => [...prevMessages, [value,1]]);

        await delay(5);

        window.scrollTo({
            top: Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            ),
            behavior: 'smooth',
            });

        const res = await generateResponse(value);
        setMessages(prevMessages => [...prevMessages, [res,0]]);

        await delay(5);

        window.scrollTo({
            top: Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            ),
            behavior: 'smooth',
            });
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
            <div className="mx-auto w-50">
                <div className="align-self-start px-2"> Mission to Marsh </div>
            </div>
            <ChatWindowDisplay messages={messages} />
            <EnterPromptField onSend={handleSend} onReset={handleReset}/>
        </div>
    );
}

export default ChatWindow;