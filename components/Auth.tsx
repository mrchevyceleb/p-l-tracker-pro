
import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import Button from './ui/Button';
import Card from './ui/Card';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 mb-4 border border-zinc-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">P&L Tracker Pro</h1>
            <p className="text-zinc-400 mt-2">Sign in to manage your business finances.</p>
        </div>
        
        <Card>
            <form onSubmit={handleAuth} className="space-y-4">
                {message && (
                    <div className={`p-3 rounded text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                        {message.text}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500"
                        placeholder="you@company.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500"
                        placeholder="••••••••"
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </Button>
            </form>
            <div className="mt-4 text-center">
                <button 
                    onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                    {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
            </div>
        </Card>
      </div>
    </div>
  );
}