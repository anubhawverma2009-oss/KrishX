import re

with open('src/components/AIAssistant.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Mic and MicOff to lucide-react imports
content = re.sub(r'import\s*\{\s*(.*?)\s*\}\s*from\s*\'lucide-react\';', r'import { \1, Mic, MicOff } from \'lucide-react\';', content, flags=re.DOTALL)

# Find the export const AIAssistant... to add state
state_block = """  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setInputText(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current.onerror = (e: any) => {
          console.error("Speech recognition error", e);
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'hinglish' ? 'hi-IN' : 'en-US';
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };
"""

content = content.replace("  const chatEndRef = useRef<HTMLDivElement>(null);", state_block + "\n  const chatEndRef = useRef<HTMLDivElement>(null);")

input_html = """            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage(inputText)}
                placeholder={t.ai.inputPlaceholder}
                disabled={loading}
                className="premium-input w-full py-4 pl-5 pr-12 text-[14px]"
              />
              <button
                onClick={toggleRecording}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isRecording ? 'bg-rose-100 text-rose-600 animate-pulse' : 'text-krishx-dark-700/60 hover:text-krishx-green-600 hover:bg-krishx-earth-100'}`}
                title="Voice Input"
              >
                {isRecording ? <Mic className="w-5 h-5" strokeWidth={1.5} /> : <MicOff className="w-5 h-5" strokeWidth={1.5} />}
              </button>
            </div>"""

old_input_html = """            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage(inputText)}
              placeholder={t.ai.inputPlaceholder}
              disabled={loading}
              className="premium-input flex-1 py-4 px-5 text-[14px]"
            />"""

content = content.replace(old_input_html, input_html)

with open('src/components/AIAssistant.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
