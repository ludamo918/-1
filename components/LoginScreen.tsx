import React, { useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (key: string) => void;
  currentAvatar: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, currentAvatar, onAvatarChange }) => {
  const [inputKey, setInputKey] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F9FAFC] text-[#11142D] relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6C5DD3]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF754C]/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 bg-white p-10 rounded-[30px] shadow-2xl w-full max-w-md border border-[#E4E4E4] text-center animate-scale-in">
          {/* 头像部分 */}
          <div className="relative w-24 h-24 mx-auto mb-6 group">
             <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-[#6C5DD3] shadow-lg shadow-indigo-200">
                <img src={currentAvatar} alt="User" className="w-full h-full object-cover" />
             </div>
             <label className="absolute bottom-0 right-0 bg-[#11142D] text-white p-2 rounded-full cursor-pointer hover:bg-[#6C5DD3] transition-colors shadow-md">
                <UploadCloud size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
             </label>
          </div>

          <h1 className="text-3xl font-black mb-2 text-[#11142D]">欢迎回来</h1>
          <p className="text-[#808191] mb-8 text-sm font-bold">TK Pro 电商数据分析系统</p>
          
          <div className="relative w-full mb-6 group">
            <input 
              type="password" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="请输入密码 / API Key"
              className="w-full p-4 bg-[#F9FAFC] border border-[#E4E4E4] rounded-2xl text-[#11142D] font-bold outline-none focus:border-[#6C5DD3] transition-all group-hover:bg-white"
              onKeyDown={(e) => e.key === 'Enter' && onLogin(inputKey)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B2B3BD]">
                <CheckCircle2 size={20} />
            </div>
          </div>
          
          <button 
            onClick={() => onLogin(inputKey)}
            className="w-full bg-[#6C5DD3] hover:bg-[#5a4cb5] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-1 active:scale-95"
          >
            进入系统 (Enter System)
          </button>
          
          <p className="mt-6 text-xs text-[#B2B3BD] font-medium">
            请输入管理员密码或个人 API Key 以继续
          </p>
      </div>
    </div>
  );
};

// 👇 关键就是这一行！必须要有！
export default LoginScreen;
