import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [callerText, setCallerText] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [useMicrophone, setUseMicrophone] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new window.webkitSpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = selectedLanguage;

      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript;
            setCallerText(prev => prev + finalTranscript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      setRecognition(recognitionInstance);
    }
  }, [selectedLanguage]);

  const startRecognition = () => {
    if (recognition) {
      recognition.start();
    }
  };

  const stopRecognition = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const handleFileChange = (event) => {
    setAudioFile(event.target.files[0]);
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    if (recognition) {
      recognition.lang = e.target.value;
    }
  };

  const handleInputChange = (event) => {
    setUseMicrophone(event.target.value === 'microphone');
  };

  const handleSubmit = async () => {
    if (!audioFile && !useMicrophone) {
      alert("Please select an audio file or use the microphone");
      return;
    }

    const formData = new FormData();
    if (audioFile) {
      formData.append('audio_file', audioFile);
    }
    formData.append('language', selectedLanguage);

    try {
      console.log('Sending fetch request...');
      const response = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to transcribe audio: ${errorText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Transcription received:', data.transcription);  // Log the transcription
      setCallerText(data.transcription);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert(`Error transcribing audio: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <div className="caller">
        <h2>Caller</h2>
        <label>Select language:</label>
        <select id="language" value={selectedLanguage} onChange={handleLanguageChange}>
          <option value="ur-PK">Urdu (Pakistan)</option>
          <option value="pa-IN">Punjabi (India)</option>
          <option value="ar-SA">Arabic (Saudi Arabia)</option>
          <option value="en-US">English (US)</option>
          <option value="fa-IR">Farsi (Iran)</option>
        </select>
        <div>
          <label>Choose input method:</label>
          <input type="radio" id="microphone" name="input_method" value="microphone" checked={useMicrophone} onChange={handleInputChange} />
          <label htmlFor="microphone">Microphone</label>
          <input type="radio" id="audio_file" name="input_method" value="audio_file" checked={!useMicrophone} onChange={handleInputChange} />
          <label htmlFor="audio_file">Audio File</label>
        </div>
        {useMicrophone ? (
          <div>
            <button onClick={startRecognition}>Start</button>
            <button onClick={stopRecognition}>Stop</button>
          </div>
        ) : (
          <div>
            <input type="file" id="audio_file_input" accept="audio/*" onChange={handleFileChange} />
            <button onClick={handleSubmit}>Submit</button>
          </div>
        )}
        <textarea
          value={callerText}
          onChange={(e) => setCallerText(e.target.value)}
          placeholder="Caller text"
        />
      </div>
    </div>
  );
};

export default App;
