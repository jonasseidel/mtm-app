
import ReactMarkdown from 'react-markdown';

interface ChatWindowProps {
  messages: [string, number][];
}

function ChatWindowDisplay({messages}: ChatWindowProps) {

  return (
      <div className="container border rounded-4 min-vh-100 w-50 bg-light p-3">
        <div className="vstack gap-3 mx-auto">
          {messages.map(([message, source], index) =>
            source % 2 === 1 ? (
              <div className="card rounded-4 align-self-end" key={`${index}-question`}>
                <div className="card-body">
                  <h6 className="card-title text-primary">You</h6>
                  <ReactMarkdown >{message}</ReactMarkdown>
                  
                </div>
              </div>
            ) : (
              
              <div className="card rounded-4 align-self-start" key={`${index}-answer`}>
                <div className="card-body">
                  <h6 className="card-title text-success">Bot</h6>
                  <ReactMarkdown >{message}</ReactMarkdown>
                  
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
    </div>
  );
}

export default ChatWindowDisplay;
