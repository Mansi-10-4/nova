
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { ImageSize } from '../types';

interface DesignStudioProps {
  onCancel: () => void;
}

const DesignStudio: React.FC<DesignStudioProps> = ({ onCancel }) => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const url = await generateImage(prompt, size);
      setGeneratedUrl(url);
    } catch (err: any) {
      console.error(err);
      // If requested entity was not found, it often means the selected API key is invalid/expired
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("404")) {
        setError("API Key Error. Please ensure you have selected a valid, billing-enabled API key from a paid GCP project.");
        // Prompt user to select key again as per guidelines when entity not found
        await window.aistudio.openSelectKey();
      } else {
        setError("Failed to generate. Please try a different prompt or check your connection.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <button 
        onClick={onCancel}
        className="text-xs uppercase tracking-widest text-gray-400 hover:text-black mb-8 flex items-center gap-2"
      >
        <i className="fas fa-arrow-left"></i> Back to store
      </button>

      <div className="grid md:grid-cols-2 gap-16">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-light uppercase tracking-widest mb-2">Design Studio</h2>
            <p className="text-gray-400 text-xs uppercase tracking-widest">Nano Banana Pro Visualizer</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Inspiration Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A minimalist living room with raw concrete walls, a single Nordic oak chair, and warm sunset light filtering through a large window..."
                className="w-full border border-gray-100 bg-gray-50/50 p-4 rounded-none outline-none focus:border-black transition-colors min-h-[120px] text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">Output Resolution</label>
              <div className="flex gap-4">
                {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex-1 py-3 text-xs border transition-all ${
                      size === s ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs italic">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className={`w-full py-5 bg-black text-white text-xs uppercase tracking-[0.3em] font-medium transition-all flex items-center justify-center gap-3 ${
                isGenerating || !prompt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
              }`}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Generating...
                </>
              ) : (
                'Generate Concept'
              )}
            </button>
          </div>
        </div>

        <div className="aspect-square bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden relative">
          {generatedUrl ? (
            <img src={generatedUrl} alt="Generated design" className="w-full h-full object-cover animate-in fade-in duration-1000" />
          ) : (
            <div className="text-center p-8 space-y-4">
              <i className="far fa-image text-4xl text-gray-200"></i>
              <p className="text-[10px] uppercase tracking-widest text-gray-300">Your vision will appear here</p>
            </div>
          )}
          
          {isGenerating && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[10px] uppercase tracking-widest font-medium animate-pulse">Rendering Reality...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignStudio;
