import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LayoutGrid, Lock, Mail, ArrowRight, Loader2, User, Building2, Briefcase, AlertCircle, RefreshCw } from 'lucide-react';
import { useMockBackend } from '../services/firebase';

export const Login: React.FC = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [orgName, setOrgName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getFriendlyErrorMessage = (err: any) => {
    const msg = err.message || '';
    if (msg.includes('auth/user-not-found') || msg.includes('auth/invalid-credential')) {
        return "Account not found. If you just connected a real database, you need to Sign Up first.";
    }
    if (msg.includes('auth/wrong-password')) {
        return "Incorrect password.";
    }
    if (msg.includes('auth/network-request-failed')) {
        return "Network error. Please check your connection.";
    }
    if (msg.includes('auth/api-key-not-valid')) {
        return "Invalid API Key in configuration. Please reset connection.";
    }
    if (msg.includes('Firebase not initialized')) {
        return "Cloud configuration is invalid. Please reset connection.";
    }
    return msg || 'Authentication failed. Please check your details.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (isLogin) {
        await login(email || 'admin@university.edu', password); 
      } else {
        await signup(email, name, title, orgName, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleEmergencyReset = () => {
      if (window.confirm("This will clear your saved Cloud Configuration and return to Local Simulation Mode. Continue?")) {
          localStorage.removeItem('advancement_os_firebase_config');
          localStorage.removeItem('advancement_os_gemini_key');
          window.location.reload();
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative">
          {!useMockBackend && (
              <div className="absolute top-4 right-4">
                  <button 
                    onClick={handleEmergencyReset}
                    className="text-slate-500 hover:text-white transition-colors p-1 rounded"
                    title="Reset Connection Settings"
                  >
                      <RefreshCw className="w-4 h-4" />
                  </button>
              </div>
          )}
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-xl mb-4 shadow-lg shadow-indigo-900/20">
            <LayoutGrid className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Advancement OS</h1>
          <p className="text-slate-400 text-sm mt-2">
              {useMockBackend ? 'Enterprise Edition (Simulated)' : 'Enterprise Edition (Cloud Connected)'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Jane Doe"
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Job Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Director of Development"
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Organization / College</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="University of Technology"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="name@university.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder={isLogin ? "••••••••" : "Create a password"}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Authenticating...' : 'Creating Workspace...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={toggleMode}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign In"}
            </button>
          </div>

          {isLogin && useMockBackend && (
            <div className="mt-8 text-center pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                Protected by Enterprise SSO. <br/>
                Use <span className="font-mono text-slate-500">swayman@cccd.edu</span> to demo.
                </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-6 text-slate-400 grayscale opacity-60">
         <span className="text-xs font-bold">TRUSTED BY</span>
         <span className="text-sm font-serif">Harvard</span>
         <span className="text-sm font-serif">Stanford</span>
         <span className="text-sm font-serif">UCLA</span>
         <span className="text-sm font-serif">NYU</span>
      </div>
    </div>
  );
};