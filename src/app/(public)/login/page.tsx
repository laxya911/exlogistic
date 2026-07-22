'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
      } else {
        toast.success('Successfully logged in');
        router.push('/launcher');
        router.refresh();
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        
        {/* Logo/Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass border border-white/10 mb-6 shadow-2xl shadow-blue-500/10">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-cyan-400 rotate-12" />
          </div>
          <h1 className="text-3xl font-display font-medium tracking-tight mb-2">ExLogis ERP</h1>
          <p className="text-white/50 text-sm font-mono tracking-widest uppercase">Global Export Matrix</p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="glass rounded-4xl border border-white/5 p-8 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-b from-white/03 to-transparent pointer-events-none" />
          
          <h2 className="text-xl font-medium mb-8">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/60 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  placeholder="admin@exlogis.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-mono text-white/60 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors" onClick={(e) => e.preventDefault()}>
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-2">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-white/20 bg-white/5'}`}>
                  {rememberMe && <CheckIcon />}
                </div>
                Remember this device
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-4 font-medium transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Registration Stub */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/50">
              Don't have an account?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors font-medium" onClick={(e) => e.preventDefault()}>
                Request access
              </a>
            </p>
          </div>
        </motion.div>
        
        {/* Helper Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-white/40"
        >
          <Info size={14} />
          <span>Use <strong className="text-white/70">admin@exlogis.com</strong> / <strong className="text-white/70">password123</strong></span>
        </motion.div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
