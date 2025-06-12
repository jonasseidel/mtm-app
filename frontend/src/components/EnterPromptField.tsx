import { useState } from 'react';

interface EnterPromptFieldProps {
    onSend: (value: string) => void;
    onReset: () => void;
    placeholder?: string;
}

function EnterPromptField({onSend, onReset, placeholder = "Deine Frage ..."}: EnterPromptFieldProps) {
  const [value, setValue] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
  };

  const handleSend = () => {
    if (value.trim() !== '') {
      onSend(value);
      setValue(''); // Clear the input after sending
    }
  }

  const handleReset = () => {
    onReset();
    setValue('');
  }

  return (
        <div className="hstack gap-4 p-3 mx-auto border bg-light w-50 rounded-4 align-items-center justify-content-center fixed-bottom mb-1">
            <textarea
                className="border rounded w-50"
                value={value}
                onChange={handleChange}
                onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault(); // Prevents new line on Enter
                            handleSend();
                        }
                    }
                }
                placeholder={placeholder}
            />
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <button className="btn btn-primary me-md-2" type="button" onClick={handleSend}>Send</button>
                <button className="btn btn-secondary" type="button" onClick={handleReset}>Refresh</button>
            </div>
        </div>
  );
}
export default EnterPromptField;