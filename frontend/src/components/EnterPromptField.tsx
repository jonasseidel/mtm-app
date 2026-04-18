import { useState, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import './ChatWindow.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface EnterPromptFieldProps {
    onSend: (value: string) => void;
    onReset: () => void;
    placeholder?: string;
}

function EnterPromptField({onSend, onReset, placeholder = "Deine Frage ..."}: EnterPromptFieldProps) {
  const [value, setValue] = useState('');
  const [sendDisabled, setSendDisabled] = useState(false);
  const [resetDisabled, setResetDisabled] = useState(false);
  const [lastSym , setLastSym] = useState('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isSending = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
  };

  const handleSend = async () => {
    if (value.trim() !== '' && !isSending.current) {
      isSending.current = true;
      setSendDisabled(true);
      setValue('');
      await onSend(value);
      setSendDisabled(false);
      isSending.current = false;
    }
  }

  const handleReset = async () => {
    setResetDisabled(true);
    setSendDisabled(true);
    setValue('');
    await onReset();
    setResetDisabled(false);
    setSendDisabled(false);
  }

  const focusInput = () => {
    inputRef.current?.focus();
  };

  //Outdated function to handle height change. Solved differently now.
  const handleHeightChange = () => {
    //Add newline to the value
    if (value.endsWith('\n') || value.length === 0 || lastSym === 'Backspace') {
      return; // Prevents adding multiple newlines
    }
    //setValue(value + '\n');
  };

  return (

        <div className='bg-light rounded-4 justify-content-center fixed-bottom mb-1 chat-box mx-auto border p-2' onClick={focusInput}>
          <div className="vstack gap-2 mx-auto align-items-center">
            <TextareaAutosize
                    className="d-flex bg-light w-100 chat-input p-2 form-control"
                    ref={inputRef}
                    value={value}
                    minRows={1}
                    maxRows={5}
                    onHeightChange={handleHeightChange}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault(); // Prevents new line on Enter
                                handleSend();
                            } else {
                              setLastSym(e.key);
                            }

                        }
                    }
                    placeholder={placeholder}
                />
            <div className="hstack gap-4 ">
                <button className="btn btn-outline-secondary rounded-circle" type="button" onClick={handleReset} disabled={resetDisabled}><i className="bi bi-arrow-repeat fs-5"></i></button>
                <button className="btn btn-outline-primary rounded-circle ms-auto" type="button" onClick={handleSend} disabled={sendDisabled}> <i className="bi bi-arrow-up fs-5"></i></button>
            </div>
          </div>
        </div>
  );
}
export default EnterPromptField;