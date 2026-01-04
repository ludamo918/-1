import React, { useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (key: string) => void;
  currentAvatar?: string;
  onAvatarChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  currentAvatar = "https://api.dicebear.com/9.x/notionists/svg?seed=Felix", 
  onAvatarChange 
}) => {
  const [inputKey, setInputKey] = useState("");

  const handleEnter = () => {
    if (inputKey.trim()) {
      onLogin(inputKey);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F9FAFC] text-[#11142D] relative overflow-hidden font-sans">
      <div className="z-10 bg-white p-10 rounded-[30px] shadow-2xl w-full max-w-md border border-[#E4E4E4] text-center">
          <div className="relative w-24 h-24 mx-auto mb-6 group">
             <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-[#6C5DD3] shadow-lg">
                <img src={currentAvatar} alt="User" className="w-full h-full object-cover" />
             </div>
             {onAvatarChange && (
                 <label className="absolute bottom-0 right-0 bg-[#11142D] text-white p-2 rounded-full cursor-pointer hover:bg-[#6C5DD3]">
                    <UploadCloud size={14} />
                    <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                 </label>
             )}
          </div>

          <h1 className="text-3xl font-black mb-2 text-[#11142D]">欢迎回来</h1>
          <p className="text-[#808191] mb-8 text-sm font-bold">TK Pro 电商数据分析系统</p>
          
          <div className="relative w-full mb-6">
            <input 
              type="password" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              placeholder="请输入密码 (admin / 888888)"
              className="w-full p-4 bg-[#F9FAFC] border border-[#E4E4E4] rounded-2xl text-[#11142D] font-bold outline-none focus:border-[#6C5DD3]"
            />
          </div>
          
          <button onClick={handleEnter} className="w-full bg-[#6C5DD3] hover:bg-[#5a4cb5] text-white font-bold py-4 rounded-2xl shadow-lg transition-all">
            进入系统
          </button>
      </div>
    </div>
  );
};

export default LoginScreen;
