import re

with open('src/components/AIAssistant.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_block_old = """  const [isRecording, setIsRecording] = useState(false);
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
  };"""

state_block_new = """  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
          // Show some loading indicator in text if possible
          const originalText = inputText;
          setInputText(prev => prev ? prev + ' (Transcribing...)' : '(Transcribing...)');
          
          try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64AudioMessage = reader.result as string;
              
              const res = await fetch('/api/ai/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64AudioMessage, language })
              });
              
              if (res.ok) {
                const data = await res.json();
                if (data.transcript) {
                  setInputText(originalText ? originalText + ' ' + data.transcript : data.transcript);
                } else {
                  setInputText(originalText);
                }
              } else {
                console.error("Failed to transcribe");
                setInputText(originalText);
              }
            };
          } catch (e) {
            console.error("Transcription error:", e);
            setInputText(originalText);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert(language === 'hi' ? 'माइक्रोफोन की अनुमति दें' : 'Please allow microphone access to use voice input.');
      }
    }
  };"""

content = content.replace(state_block_old, state_block_new)

with open('src/components/AIAssistant.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
