
import ReactMarkdown from 'react-markdown';
import './ChatWindow.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface ChatWindowProps {
  messages: [string, number][];
  isStreaming: boolean;
  onSkip: () => void;
}

function ChatWindowDisplay({messages, isStreaming, onSkip}: ChatWindowProps) {

  return (
      <div className="container border rounded-4 min-vh-100 bg-light p-3 chat-container">
        <div className="vstack gap-3 p-3 mx-auto">
          {messages.map(([message, source], index) =>
            source === 1 ? (
              <div className="card rounded-4 align-self-end" key={`${index}-question`} style={{ maxWidth: '85%' }}>
                <div className="card-body">
                  <h6 className="card-title text-primary text-break">You</h6>
                  <ReactMarkdown>{message}</ReactMarkdown>
                </div>
              </div>
            ) : source === 2 ? (
              <div className="card rounded-4 align-self-start border-danger" key={`${index}-error`} style={{ maxWidth: '85%' }}>
                <div className="card-body">
                  <h6 className="card-title text-danger">Error</h6>
                  <p className="text-danger mb-0">{message}</p>
                </div>
              </div>
            ) : (
              <div className="card rounded-4 align-self-start" key={`${index}-answer`} style={{ maxWidth: '85%' }}>
                <div className="card-body" style={{ position: 'relative', paddingBottom: isStreaming && index === messages.length - 1 ? '2.5rem' : undefined }}>
                  <h6 className="card-title text-success">Bot</h6>
                  {message ? <ReactMarkdown>{message}</ReactMarkdown> : <div><i className="bi bi-broadcast fs-5"></i></div>}
                  {isStreaming && index === messages.length - 1 && message.length >= 80 && (
                    <button className="btn btn-sm btn-outline-secondary rounded-circle" onClick={onSkip} title="Skip typewriter"
                      style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
                      <i className="bi bi-skip-end-fill"></i>
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
        <div className="invisible">
            Test
        </div>
        <div className="invisible">
            Test
        </div>
        <div className="invisible">
            Test
        </div>
        <div className="invisible">
            Test
        </div>
        <div className="invisible">
            Test
        </div>
    </div>
  );
}

export default ChatWindowDisplay;
