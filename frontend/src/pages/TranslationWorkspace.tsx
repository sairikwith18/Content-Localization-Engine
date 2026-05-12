import { useState, useRef } from 'react';
import { 
  FileText, Mic, FileDigit, Download, Play, Pause,
  Share2, Save, FileAudio, RefreshCw, AlertCircle,
  Languages, Zap, Sparkles
} from 'lucide-react';

// Languages mapped to the backend LANG_MAP in app.py
const LANGUAGE_CODES = {
  "English": "en",
  "Hindi": "hi",
  "Telugu": "te",
  "Tamil": "ta",
  "Kannada": "kn"
};

type InputType = 'text' | 'document' | 'audio';

export default function TranslationWorkspace() {
  const [inputType, setInputType] = useState<InputType>('text');
  
  // Settings
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [domain, setDomain] = useState('general');
  const [engine, setEngine] = useState('gemini');

  // Input States
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Results State
  const [results, setResults] = useState<{
    original_text: string;
    draft_translation: string;
    refined_translation: string;
    audio_url: string;
  } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const processLocalization = async () => {
    setError('');
    
    if (inputType === 'text' && !rawText.trim()) {
      setError('Please type some text to translate.');
      return;
    }
    if ((inputType === 'document' || inputType === 'audio') && !selectedFile) {
      setError('Please select a file to translate.');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    const formData = new FormData();
    formData.append('target_language', targetLang);
    formData.append('domain', domain);
    formData.append('llm_engine', engine);

    if (inputType === 'text') {
      formData.append('text', rawText);
    } else {
      formData.append('file', selectedFile!);
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sh_token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Backend processing failed.');
      }

      setResults(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during processing.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Input Settings */}
        <div className="w-full lg:w-1/3 flex flex-col gap-5">
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100 card-shadow">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: '#1e2a5e' }}>
              <Languages size={20} className="text-orange-500" />
              Localization Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1e2a5e' }}>Source Language</label>
                <select 
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-gray-50 cursor-pointer"
                  value={sourceLang} onChange={e => setSourceLang(e.target.value)}
                >
                  {Object.entries(LANGUAGE_CODES).map(([name, code]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1e2a5e' }}>Target Language</label>
                <select 
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-gray-50 cursor-pointer"
                  value={targetLang} onChange={e => setTargetLang(e.target.value)}
                >
                  {Object.entries(LANGUAGE_CODES).map(([name, code]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100"></div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1e2a5e' }}>Specialization Domain</label>
                <select 
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-gray-50 cursor-pointer"
                  value={domain} onChange={e => setDomain(e.target.value)}
                >
                  <option value="general">General (Standard)</option>
                  <option value="medical">Medical / Healthcare</option>
                  <option value="legal">Legal / Documents</option>
                  <option value="education">Education / Textbooks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1e2a5e' }}>AI Refinement Engine</label>
                <p className="text-xs text-gray-500 mb-2">Controls LLM RAG injection</p>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setEngine('gemini')}
                    className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${engine === 'gemini' ? 'bg-white shadow text-[#1e2a5e]' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Gemini 2.5 Flash
                  </button>
                  <button 
                    onClick={() => setEngine('sarvam')}
                    className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${engine === 'sarvam' ? 'bg-white shadow text-[#1e2a5e]' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Sarvam Indic LLM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Input Interface & Output */}
        <div className="w-full lg:w-2/3 flex flex-col gap-5">
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100 card-shadow flex flex-col">
            
            {/* Input Modality Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-50 p-1.5 rounded-xl w-fit">
              <button 
                onClick={() => { setInputType('text'); setResults(null); setError(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${inputType === 'text' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <FileText size={16} /> Text
              </button>
              <button 
                onClick={() => { setInputType('document'); setResults(null); setError(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${inputType === 'document' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <FileDigit size={16} /> Document
              </button>
              <button 
                onClick={() => { setInputType('audio'); setResults(null); setError(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${inputType === 'audio' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <Mic size={16} /> Audio
              </button>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Input Form UI */}
            {inputType === 'text' ? (
              <textarea 
                className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-base"
                placeholder="Type or paste text you want to localize here..."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />
            ) : (
              <div 
                onClick={handleFileClick}
                className="w-full h-48 dropzone-bg border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-orange-400 group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept={inputType === 'document' ? ".pdf" : ".wav,.mp3"}
                />
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  {inputType === 'document' ? <FileDigit size={24} className="text-blue-500" /> : <FileAudio size={24} className="text-orange-500" />}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  {selectedFile ? selectedFile.name : `Upload a ${inputType === 'document' ? 'PDF document' : 'WAV/MP3 audio file'}`}
                </h3>
                <p className="text-xs text-gray-500 font-medium">Click here to browse your files</p>
              </div>
            )}

            {/* Submit CTA */}
            <div className="mt-5 flex justify-end flex-wrap items-center gap-3">
              <button 
                onClick={processLocalization}
                disabled={isProcessing}
                className="gradient-orange text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <><RefreshCw size={18} className="animate-spin" /> Processing Models...</>
                ) : (
                  <><Zap size={18} /> Initiate Pipeline</>
                )}
              </button>
            </div>
            
          </div>

          {/* Results Area */}
          {results && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 card-shadow mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold" style={{ color: '#1e2a5e' }}>Localization Results</h3>
                <div className="flex gap-2">
                   <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"><Save size={16} /></button>
                   <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"><Share2 size={16} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Source Extracted */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Extracted Source Text</span>
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    {results.original_text || "No text was extracted."}
                  </p>
                </div>

                {/* ML Draft Translation */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap size={12} /> Raw ML Output (NLLB)
                  </span>
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    {results.draft_translation || "No draft available."}
                  </p>
                </div>

                {/* Final Refined Target */}
                <div className="p-4 rounded-xl border border-orange-200" style={{ background: 'rgba(249,115,22,0.03)' }}>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles size={12} /> Refined Output ({engine})
                  </span>
                  <p className="text-sm text-gray-900 leading-relaxed font-bold">
                    {results.refined_translation || results.draft_translation}
                  </p>

                  {/* Audio Synthesis Player */}
                  {results.audio_url && (
                    <div className="mt-5 p-3 rounded-lg border border-orange-100 bg-white flex items-center gap-3">
                      <audio ref={audioRef} src={results.audio_url} onEnded={() => setIsPlaying(false)} className="hidden" />
                      <button 
                        onClick={toggleAudio}
                        className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center text-white flex-shrink-0"
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                      </button>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold" style={{ color: '#1e2a5e' }}>Synthesized Voice Output</span>
                        <span className="text-[10px] text-gray-400">Powered by Meta MMS-TTS</span>
                      </div>
                      <button className="ml-auto p-2 text-gray-400 hover:text-orange-500">
                        <Download size={16} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
