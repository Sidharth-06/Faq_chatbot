'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Sparkles, User, Sliders, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SpotlightCard from '@/components/SpotlightCard';
import ShinyText from '@/components/ShinyText';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [llmTemp, setLlmTemp] = useState('balanced');
  const [maxTokens, setMaxTokens] = useState('300');
  const [saving, setSaving] = useState(false);
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
    
    getProfile();
  }, [supabase]);

  const handleSavePreferences = () => {
    setSaving(true);
    try {
      localStorage.setItem('resolv_llm_temp', llmTemp);
      localStorage.setItem('resolv_max_tokens', maxTokens);
      
      toast.success('AI preferences saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
            Manage your account preferences and configure assistant response settings.
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
                  Resolv.ai is an intelligent, high-performance assistant for fast, reliable answers and productive conversations.
                </p>
                <div className="mt-6 pt-3 border-t border-zinc-900 text-[10px] font-black text-zinc-500 flex justify-between font-mono">
                  <span>Engine Version: 1.2.0</span>
                  <span>© {new Date().getFullYear()} Resolv.ai</span>
                </div>
              </SpotlightCard>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
