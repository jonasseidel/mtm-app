import { useState } from "react";
import "./theme.css";
import Sidebar from "./components/Sidebar";
import LandingPage from "./components/LandingPage";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [view, setView] = useState<'landing' | 'chat'>('landing');
  const [chatKey, setChatKey] = useState(0);

  const startNewChat = () => {
    // No conversation history/saving yet — "new chat" just clears the
    // session id so the backend starts a fresh one, then remounts ChatWindow.
    localStorage.removeItem("session_id");
    setChatKey((k) => k + 1);
    setView('chat');
  };

  // Going to the (shorter) landing page while scrolled down in a long chat
  // leaves the browser to clamp scrollY into the new bounds, which shows as
  // a content bump right as it happens. Reset first so there's nothing to
  // clamp. (Not applied to startNewChat: ChatWindow's own auto-scroll while
  // the greeting streams in fights a reset there — separate, still-open issue.)
  const showHowItWorks = () => {
    window.scrollTo(0, 0);
    setView('landing');
  };

  return (
    <div className="mtm-shell">
      <Sidebar
        active={view}
        onHowItWorks={showHowItWorks}
        onNewChat={startNewChat}
      />
      <main className="mtm-main">
        {view === 'landing' ? (
          <LandingPage onStart={startNewChat} />
        ) : (
          <ChatWindow key={chatKey} />
        )}
      </main>
    </div>
  );
}

export default App;
