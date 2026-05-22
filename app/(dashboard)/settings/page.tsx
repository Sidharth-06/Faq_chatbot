'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Sparkles, User, Sliders, Loader2, ShieldCheck, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SpotlightCard from '@/components/SpotlightCard';
import ShinyText from '@/components/ShinyText';
import toast from 'react-hot-toast';

interface ModelOption {
  id: string;
  name: string;
  desc: string;
}

const POPULAR_MODELS: ModelOption[] = [
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct', desc: 'Fast, highly-capable general purpose model' },
  { id: '@cf/meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', desc: 'Large, intelligent reasoning model' },
  { id: '@cf/meta/llama-3-8b-instruct', name: 'Llama 3 8B Instruct', desc: 'Capable 8B language model from Meta' },
  { id: '@cf/mistral/mistral-7b-instruct-v0.2', name: 'Mistral 7B Instruct v0.2', desc: 'Reliable, compact instruction model' },
  { id: '@cf/qwen/qwen1.5-14b-chat', name: 'Qwen 1.5 14B Chat', desc: 'Capable Qwen chat and reasoning model' },
];

const DEFAULT_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.3-70b-instruct',
  '@cf/meta/llama-3-8b-instruct',
  '@cf/mistral/mistral-7b-instruct-v0.2',
  '@cf/qwen/qwen1.5-14b-chat',
];

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [llmTemp, setLlmTemp] = useState('balanced');
  const [maxTokens, setMaxTokens] = useState('300');
  const [saving, setSaving] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [savingModels, setSavingModels] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    }
    
    // Load local settings if any
    const savedTemp = localStorage.getItem('resolv_llm_temp');
    const savedTokens = localStorage.getItem('resolv_max_tokens');
    if (savedTemp) setLlmTemp(savedTemp);
    if (savedTokens) setMaxTokens(savedTokens);

    // Load custom models selection
    const savedModelsRaw = localStorage.getItem('resolv_custom_models');
    if (savedModelsRaw) {
      try {
        const parsed = JSON.parse(savedModelsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedModels(parsed);
        } else {
          setSelectedModels(DEFAULT_MODELS);
        }
      } catch (e) {
        setSelectedModels(DEFAULT_MODELS);
      }
    } else {
      setSelectedModels(DEFAULT_MODELS);
    }
    
    getProfile();
  }, [supabase]);

  const handleSavePreferences = () => {
    setSaving(true);
    try {
      localStorage.setItem('resolv_llm_temp', llmTemp);
      localStorage.setItem('resolv_max_tokens', maxTokens);
      
      toast.success('AI preferences saved successfully!', {
        style: {
          border: '2px solid black',
          padding: '12px',
          color: '#000',
          background: '#fff',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
          fontWeight: 'bold',
        }
      });
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      if (selectedModels.length <= 1) {
        toast.error('You must keep at least one model selected!', {
          style: {
            border: '2px solid black',
            padding: '12px',
            color: '#000',
            background: '#fff',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
            fontWeight: 'bold',
          }
        });
        return;
      }
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else {
      if (selectedModels.length >= 5) {
        toast.error('Limit reached! You can select up to 5 models only. Deselect another model first.', {
          icon: '⚠️',
          style: {
            border: '2px solid black',
            padding: '12px',
            color: '#000',
            background: '#fff',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px 0px #000',
            fontWeight: 'bold',
          }
        });
        return;
      }
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const handleSaveModels = () => {
    setSavingModels(true);
    try {
      localStorage.setItem('resolv_custom_models', JSON.stringify(selectedModels));
      
      // Update active model if it is not in the new selected list
      const currentActive = localStorage.getItem('resolv_selected_model');
      if (!currentActive || !selectedModels.includes(currentActive)) {
        localStorage.setItem('resolv_selected_model', selectedModels[0]);
      }
      
      toast.success('Custom model selection saved successfully!', {
        style: {
          border: '2px solid black',
          padding: '12px',
          color: '#000',
          background: '#fff',
          borderRadius: '0px',
          boxShadow: '4px 4px 0px 0px #000',
          fontWeight: 'bold',
        }
      });
    } catch (err) {
      toast.error('Failed to save model selection');
    } finally {
      setSavingModels(false);
    }
  };

  return (
    <div className="min-h-full bg-brand-cream text-zinc-950 p-6 lg:p-8 relative font-sans select-none overflow-hidden">
      
      {/* Subtle decorative dot grid background matching the dashboard style */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto flex flex-col gap-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-start">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-black bg-brand-cream text-brand-red text-xs font-black shadow-[3px_3px_0px_0px_#000] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-red shrink-0" /> 
            <span>Resolv.ai Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-zinc-950 tracking-tight font-display">
            Workspace Settings
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 max-w-xl font-bold">
            Manage your account preferences and configure FAQ engine settings.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Account Profile & Preferences */}
            <div className="flex flex-col gap-6">
              
              {/* Account Card */}
              <SpotlightCard className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000] rounded-none relative overflow-hidden transition-all duration-300 hover:shadow-[10px_10px_0px_0px_#000] w-full">
                <h3 className="text-base font-black text-zinc-950 flex items-center gap-2 mb-4 border-b-2 border-black pb-2.5">
                  <User className="w-4.5 h-4.5 text-brand-red" />
                  <span>Account Profile</span>
                </h3>
                
                <div className="flex flex-col gap-3 text-sm text-zinc-600 font-bold">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black font-mono">Email Address</span>
                    <span className="text-zinc-900 font-extrabold">{email || 'Not authenticated'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-2">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black font-mono">Workspace Role</span>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold text-[10px] py-1 px-3 flex items-center gap-1 rounded-none shadow-[2px_2px_0px_0px_#10b981]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Workspace Administrator
                      </Badge>
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Preferences Card */}
              <SpotlightCard className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000] rounded-none relative overflow-hidden transition-all duration-300 hover:shadow-[10px_10px_0px_0px_#000] w-full">
                <h3 className="text-base font-black text-zinc-950 flex items-center gap-2 mb-4 border-b-2 border-black pb-2.5">
                  <Sliders className="w-4.5 h-4.5 text-brand-red" />
                  <span>AI Engine Configurations</span>
                </h3>

                <div className="flex flex-col gap-4 font-bold text-zinc-700">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">
                      LLM Temperature (Creativity)
                    </label>
                    <select
                      value={llmTemp}
                      onChange={(e) => setLlmTemp(e.target.value)}
                      className="w-full bg-white border-2 border-black text-zinc-950 text-xs font-bold px-4 py-3.5 rounded-none outline-none focus:bg-zinc-50/50 transition-all shadow-[2px_2px_0_0_#000] focus:shadow-[4px_4px_0_0_#000]"
                    >
                      <option value="deterministic">Deterministic (0.0 - Highly precise)</option>
                      <option value="balanced">Balanced (0.7 - Recommended)</option>
                      <option value="creative">Creative (1.0 - Explanatory)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">
                      Max Output Length
                    </label>
                    <select
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(e.target.value)}
                      className="w-full bg-white border-2 border-black text-zinc-950 text-xs font-bold px-4 py-3.5 rounded-none outline-none focus:bg-zinc-50/50 transition-all shadow-[2px_2px_0_0_#000] focus:shadow-[4px_4px_0_0_#000]"
                    >
                      <option value="150">Short replies (150 tokens)</option>
                      <option value="300">Standard summary (300 tokens)</option>
                      <option value="500">Long response (500 tokens)</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="w-full py-6.5 bg-zinc-950 hover:bg-zinc-900 text-white font-extrabold text-sm text-center rounded-none flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0_0_0_0_#000] transition-all duration-200 cursor-pointer mt-4 hover:text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Saving Preferences...</span>
                      </>
                    ) : (
                      <>
                        <span>Save AI Configurations</span>
                      </>
                    )}
                  </Button>
                </div>
              </SpotlightCard>

            </div>

            {/* Right Column: Brand Card */}
            <div className="flex flex-col gap-6">
              
              {/* Brand Card */}
              <SpotlightCard className="bg-zinc-950 border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000] rounded-none relative overflow-hidden transition-all duration-300 hover:shadow-[10px_10px_0px_0px_#000] w-full text-zinc-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border-2 border-black bg-brand-red flex items-center justify-center shadow-[2px_2px_0px_0px_#000] select-none">
                    <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-white font-display">
                    <span className="text-brand-red">Resolv</span>
                    <span className="text-zinc-400 font-medium">.ai</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-bold">
                  Resolv.ai is an intelligent, high-performance FAQ engine for fast, context-grounded factual retrieval.
                </p>
                <div className="mt-6 pt-3 border-t border-zinc-900 text-[10px] font-black text-zinc-500 flex justify-between font-mono">
                  <span>Engine Version: 1.2.0</span>
                  <span>© {new Date().getFullYear()} Resolv.ai</span>
                </div>
              </SpotlightCard>

              {/* Models Selection Card */}
              <SpotlightCard className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000] rounded-none relative overflow-hidden transition-all duration-300 hover:shadow-[10px_10px_0px_0px_#000] w-full">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2.5">
                  <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
                    <Cpu className="w-4.5 h-4.5 text-brand-red" />
                    <span>Free Model Picker</span>
                  </h3>
                  <div className="px-2.5 py-1 border-2 border-black bg-zinc-950 text-white text-[10px] font-black tracking-wider uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    {selectedModels.length} / 5 Selected
                  </div>
                </div>

                <p className="text-xs text-zinc-500 font-bold mb-4 leading-relaxed">
                  Choose exactly up to 5 free models from Cloudflare Workers AI to toggle between in your chats.
                </p>

                <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {POPULAR_MODELS.map((model) => {
                    const isSelected = selectedModels.includes(model.id);
                    return (
                      <div
                        key={model.id}
                        onClick={() => handleToggleModel(model.id)}
                        className={`flex items-start gap-3 p-3 border-2 border-black cursor-pointer select-none transition-all duration-150 ${
                          isSelected
                            ? 'bg-zinc-950 text-white shadow-[2px_2px_0px_0px_#000] translate-y-[-1px] translate-x-[-1px]'
                            : 'bg-white text-zinc-950 hover:bg-zinc-50'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 border-2 border-black flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-white text-zinc-950' : 'bg-white'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-extrabold">{model.name}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-zinc-400' : 'text-zinc-500'} font-bold`}>
                            {model.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={handleSaveModels}
                  disabled={savingModels}
                  className="w-full py-6.5 bg-zinc-950 hover:bg-zinc-900 text-white font-extrabold text-sm text-center rounded-none flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0_0_0_0_#000] transition-all duration-200 cursor-pointer mt-5 hover:text-white"
                >
                  {savingModels ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Models...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Model Picker</span>
                    </>
                  )}
                </Button>
              </SpotlightCard>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
