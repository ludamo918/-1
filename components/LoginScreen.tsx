import React, { useState } from 'react';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
  currentAvatar: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, currentAvatar, onAvatarChange }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for effect
    setTimeout(() => {
        if (password === '1997') {
            onLogin('guest');
        } else if (password === '20261888') {
            onLogin('admin');
        } else {
            setError(true);
            setIsLoading(false);
            setTimeout(() => setError(false), 2000);
        }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans text-[#11142D]">
      {/* Dynamic Animated Gradient Background */}
      <style>{`
        @keyframes gradient-xy {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient-xy {
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradient-xy 15s ease infinite;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 20px 80px rgba(0,0,0,0.15);
        }
      `}</style>
      
      <div className="absolute inset-0 animate-gradient-xy"></div>
      
      {/* Floating particles/overlay for texture */}
      <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>

      <div className="glass-panel p-12 rounded-[40px] w-full max-w-md z-10 relative flex flex-col items-center animate-scale-in">
        
        {/* Avatar Section - Double Click to Change (Secret Admin Feature) */}
        <label 
            className="mb-8 relative group cursor-pointer" 
            title="双击上传新头像 (Double Click to Upload)"
        >
            <div className="w-28 h-28 rounded-full p-1.5 bg-white shadow-xl shadow-black/5 transition-transform active:scale-95">
                 <div className="w-full h-full rounded-full overflow-hidden bg-[#F0EFFB]">
                    <img src={currentAvatar} alt="User Avatar" className="w-full h-full object-cover" />
                 </div>
            </div>
            {/* Status Indicator */}
            <div className="absolute -right-1 bottom-1 bg-[#2F9042] w-6 h-6 rounded-full border-4 border-white"></div>
            
            {/* Hidden Input - Enabled again but kept discreet */}
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        </label>
        
        <div className="text-center mb-10">
            {/* Changed Text to '少年阿闯' */}
            <h2 className="text-4xl font-extrabold text-[#11142D] tracking-tight drop-shadow-sm font-sans">
                少年阿闯
            </h2>
            <p className="text-[#808191] mt-3 text-sm font-bold flex items-center justify-center gap-2">
                <Sparkles size={14} className="text-[#FF754C]" fill="currentColor" />
                TK Pro Enterprise System
            </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6 w-full">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#808191] group-focus-within:text-[#6C5DD3] transition-colors">
                <Lock size={20} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入访问密钥"
              className={`w-full pl-12 pr-5 py-4 rounded-2xl border bg-white/80 text-[#11142D] outline-none transition-all duration-300 font-bold placeholder:font-medium tracking-wide placeholder:text-[#B2B3BD] shadow-sm
                ${error 
                  ? 'border-[#FF754C] focus:border-[#FF754C] bg-[#FFF0E6]' 
                  : 'border-[#E4E4E4] focus:border-[#6C5DD3] focus:shadow-md focus:shadow-indigo-100'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#11142D] hover:bg-black text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
                <>
                    <span>进入系统</span>
                    <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>
        
        <div className="mt-8 pt-6 w-full text-center border-t border-[#11142D]/5">
            <p className="text-[10px] font-bold text-[#808191] uppercase tracking-[0.2em]">Private Access Only</p>
        </div>
      </div>
    </div>
  );
};