'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Sparkles, User, Sliders, Loader2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="min-h-full bg-zinc-50 p-6 lg:p-8 relative font-sans selection:bg-zinc-900 selection:text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Resolv.ai Control Center
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Workspace Settings
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 max-w-xl font-medium">
            Manage your account preferences and configure assistant response settings.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Account Profile & Preferences */}
            <div className="flex flex-col gap-6">
              
              {/* Account Card */}
              <Card className="bg-white border border-zinc-200 p-5 rounded-xl shadow-xs">
                <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2 mb-4 border-b border-zinc-100 pb-2.5">
                  <User className="w-4.5 h-4.5 text-indigo-500" />
                  <span>Account Profile</span>
                </h3>
                
                <div className="flex flex-col gap-3 text-sm text-zinc-600 font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Email Address</span>
                    <span className="text-zinc-800 font-semibold">{email || 'Not authenticated'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-2">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Workspace Role</span>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold text-[10px] py-0.5 px-2.5 flex items-center gap-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Workspace Administrator
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Preferences Card */}
              <Card className="bg-white border border-zinc-200 p-5 rounded-xl shadow-xs">
                <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2 mb-4 border-b border-zinc-100 pb-2.5">
                  <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                  <span>AI Engine Configurations</span>
                </h3>

                <div className="flex flex-col gap-4 font-medium text-zinc-700">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      LLM Temperature (Creativity)
                    </label>
                    <select
                      value={llmTemp}
                      onChange={(e) => setLlmTemp(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-800 text-sm shadow-xs"
                    >
                      <option value="deterministic">Deterministic (0.0 - Highly precise)</option>
                      <option value="balanced">Balanced (0.7 - Recommended)</option>
                      <option value="creative">Creative (1.0 - Explanatory)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Max Output Length
                    </label>
                    <select
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-800 text-sm shadow-xs"
                    >
                      <option value="150">Short replies (150 tokens)</option>
                      <option value="300">Standard summary (300 tokens)</option>
                      <option value="500">Long response (500 tokens)</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition duration-150 shadow-sm cursor-pointer mt-2 hover:text-white"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <span>Save AI Configurations</span>
                  </Button>
                </div>
              </Card>

            </div>

            {/* Right Column: Brand Card */}
            <div className="flex flex-col gap-6">
              
              {/* Brand Card */}
              <Card className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl shadow-md text-zinc-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md select-none">
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-white font-display">
                    Resolv<span className="text-indigo-400">.ai</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Resolv.ai is an intelligent, high-performance assistant for fast, reliable answers and productive conversations.
                </p>
                <div className="mt-6 pt-3 border-t border-zinc-900 text-[10px] font-semibold text-zinc-600 flex justify-between font-mono">
                  <span>Engine Version: 1.2.0</span>
                  <span>© {new Date().getFullYear()} Resolv.ai</span>
                </div>
              </Card>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
