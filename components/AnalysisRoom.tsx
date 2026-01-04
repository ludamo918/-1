import React, { useState, useEffect } from 'react';
import { Product, AIState } from '../types';
import { calculateScore } from '../utils/helpers';
import { streamAIResponse } from '../services/aiService';
import { X, Calculator, Bot, Copy, PlayCircle, Sparkles, Wand2, Terminal, CheckCircle2, Languages } from 'lucide-react';

interface AnalysisRoomProps {
  product: Product;
  maxGmv: number;
  maxSales: number;
  onClose: () => void;
  apiKey: string;
}

export const AnalysisRoom: React.FC<AnalysisRoomProps> = ({ product, maxGmv, maxSales, onClose, apiKey }) => {
  const { grade, text, colorClass, label } = calculateScore(product, maxGmv, maxSales);
  
  // Profit Calculator
  const [costPrice, setCostPrice] = useState(product.price * 0.3);
  const [shipping, setShipping] = useState(3.5);
  const platformFee = product.price * 0.05;
  const profit = product.price - costPrice - shipping - platformFee;
  const margin = (profit / product.price) * 100;

  // AI State
  const [targetLang, setTargetLang] = useState<'en' | 'zh'>('en'); // Default to English for Global
  const [aiState, setAiState] = useState<AIState>({
    keywords: '',
    title: '',
    description: '',
    script: '',
    isGenerating: false,
    error: null
  });

  const [aiTemp, setAiTemp] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'copy' | 'script'>('copy');

  // We only reset state if product ID changes. 
  // Since parent keeps this mounted, state persists if we close and re-open same product.
  useEffect(() => {
    setAiState({
        keywords: '',
        title: '',
        description: '',
        script: '',
        isGenerating: false,
        error: null
    });
  }, [product.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Helper Wrapper
  const runAI = async (key: keyof AIState, prompt: string) => {
    if (!apiKey) return setAiState(prev => ({...prev, error: "缺少 API Key"}));
    setAiState(prev => ({...prev, isGenerating: true, error: null, [key]: ''}));
    try {
        await streamAIResponse(apiKey, prompt, aiTemp, (chunk) => {
            setAiState(prev => ({...prev, [key]: chunk}));
        });
    } catch (e: any) {
        setAiState(prev => ({...prev, error: e.message}));
    } finally {
        setAiState(prev => ({...prev, isGenerating: false}));
    }
  };

  // Prompt Logic based on Language
  const getLangInstruction = () => targetLang === 'zh' ? "Output ONLY in Simplified Chinese (简体中文)." : "Output in English.";

  const generateKeywords = () => {
    const prompt = targetLang === 'zh' 
        ? `为商品 '${product.title}' 提取 8 个高流量 TikTok SEO 关键词。请用逗号分隔。输出简体中文。`
        : `Extract 8 viral, high-volume TikTok SEO keywords for: '${product.title}'. Return as a comma-separated list. Keep keywords in English.`;
    runAI('keywords', prompt);
  };
  
  const generateTitle = () => {
    if (!aiState.keywords) return;
    const prompt = targetLang === 'zh'
        ? `使用关键词: ${aiState.keywords}，为 "${product.title}" 写一个病毒式的 TikTok Shop 商品标题（最多70字）。使用1个emoji。格式：[吸引点] [产品名] [利益点]。输出简体中文。`
        : `Create ONE viral TikTok Shop listing title (max 70 chars) for "${product.title}" using keywords: ${aiState.keywords}. Use 1 emoji. Format: [Hook] [Product] [Benefit]. Output in English.`;
    runAI('title', prompt);
  };

  const generateDesc = () => {
    if (!aiState.title) return;
    const prompt = targetLang === 'zh'
        ? `为 "${aiState.title}" 写一段转化率极高的产品描述。包含功能卖点列表。结尾要有紧急召唤行动 (CTA)。语气：兴奋、种草。输出简体中文。`
        : `Write a punchy, conversion-focused description for "${aiState.title}". Bullet points for features. Urgent CTA at end. Tone: Exciting. Output in English.`;
    runAI('description', prompt);
  };

  const generateScript = () => {
    const prompt = targetLang === 'zh'
        ? `为 ${product.title} 写一个 30秒的 TikTok UGC 短视频带货脚本。分镜头描述。左边是画面，右边是口播文案。开头3秒要有黄金三秒钩子。输出简体中文。`
        : `Write a 30s TikTok UGC script for ${product.title}. Scene by Scene. Visuals on left, Audio on right. Hook in first 3s. Output in English.`;
    runAI('script', prompt);
  };

  // Tag Component for styling
  const LabelTag = ({ icon: Icon, text }: { icon: any, text: string }) => (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0EFFB] text-[#6C5DD3] border border-indigo-100">
        <Icon size={12} strokeWidth={3} />
        <span className="text-[10px] font-extrabold tracking-widest uppercase">{text}</span>
    </div>
  );

  return (
    <div 
        className="w-full h-full bg-[#11142D]/20 backdrop-blur-sm flex justify-end" 
        onClick={onClose} // Backdrop click closes modal
    >
      <div 
        className="w-full max-w-6xl bg-[#F9FAFC] h-full shadow-2xl overflow-hidden flex flex-col border-l border-white animate-slide-in-right font-sans"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking inside
      >
        
        {/* Modern Header */}
        <div className="bg-white px-8 py-5 border-b border-[#E4E4E4] flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F0EFFB] border border-indigo-50 flex items-center justify-center text-[#6C5DD3]">
                    <Bot size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-extrabold text-[#11142D] line-clamp-1 max-w-md">{product.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-[#808191] uppercase tracking-wider">AI 智能分析室</span>
                        <span className="w-1 h-1 bg-[#E4E4E4] rounded-full"></span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorClass}`}>
                            {text} ({grade})
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 {/* Language Toggle */}
                 <div className="bg-[#F0EFFB] p-1 rounded-lg flex items-center border border-indigo-50 mr-4">
                    <button 
                        onClick={() => setTargetLang('en')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${targetLang === 'en' ? 'bg-white text-[#6C5DD3] shadow-sm' : 'text-[#808191] hover:text-[#6C5DD3]'}`}
                    >
                        <span className="text-[10px]">🇺🇸</span> English
                    </button>
                    <button 
                        onClick={() => setTargetLang('zh')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${targetLang === 'zh' ? 'bg-white text-[#6C5DD3] shadow-sm' : 'text-[#808191] hover:text-[#6C5DD3]'}`}
                    >
                        <span className="text-[10px]">🇨🇳</span> 中文
                    </button>
                 </div>

                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F0EFFB] text-[#808191] hover:text-[#6C5DD3] transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            
            {/* LEFT SIDEBAR: Product Context & Calc */}
            <div className="lg:col-span-4 bg-white border-r border-[#E4E4E4] overflow-y-auto p-6 space-y-6">
                 {/* Image */}
                <div className="aspect-square bg-[#F9FAFC] rounded-[24px] border border-[#E4E4E4] overflow-hidden p-6 flex items-center justify-center group relative">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <span className="text-[#808191]">No Image</span>
                    )}
                </div>

                {/* Profit Calc - Modernized */}
                <div className="bg-white rounded-[24px] p-6 border border-[#E4E4E4] shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-[#11142D]">
                        <Calculator size={18} className="text-[#6C5DD3]" />
                        <h3 className="font-bold text-sm uppercase tracking-wide">利润计算器 (Calculator)</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-[#F0F0F0]">
                            <span className="text-sm font-bold text-[#808191]">零售价 (Price)</span>
                            <span className="text-lg font-extrabold text-[#11142D] font-mono tracking-tight">${product.price.toFixed(2)}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] font-bold text-[#808191] uppercase mb-1.5 block">采购成本</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[#808191] text-xs">$</span>
                                    <input type="number" value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} className="w-full pl-6 pr-3 py-2 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl text-sm font-bold text-[#11142D] outline-none focus:border-[#6C5DD3] transition-colors font-mono" />
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] font-bold text-[#808191] uppercase mb-1.5 block">物流运费</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[#808191] text-xs">$</span>
                                    <input type="number" value={shipping} onChange={(e) => setShipping(Number(e.target.value))} className="w-full pl-6 pr-3 py-2 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl text-sm font-bold text-[#11142D] outline-none focus:border-[#6C5DD3] transition-colors font-mono" />
                                </div>
                             </div>
                        </div>

                        <div className="bg-[#F9FAFC] rounded-2xl p-4 border border-[#E4E4E4] mt-2">
                             <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-[#808191] font-bold">净利润 (Net Profit)</p>
                                    <p className={`text-2xl font-extrabold mt-1 font-mono tracking-tight ${profit > 0 ? 'text-[#2F9042]' : 'text-[#FF754C]'}`}>${profit.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[#808191] font-bold">毛利率</p>
                                    <p className={`text-lg font-bold font-mono ${margin > 20 ? 'text-[#2F9042]' : 'text-[#808191]'}`}>{margin.toFixed(1)}%</p>
                                </div>
                             </div>
                             {/* Progress Bar */}
                             <div className="w-full bg-[#E4E4E4] h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${margin > 0 ? 'bg-[#2F9042]' : 'bg-[#FF754C]'}`} style={{width: `${Math.max(0, Math.min(100, margin))}%`}}></div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT MAIN: AI Workbench */}
            <div className="lg:col-span-8 bg-[#F9FAFC] flex flex-col h-full overflow-hidden">
                
                {/* Controls */}
                <div className="px-8 py-6 border-b border-[#E4E4E4] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-extrabold text-xl text-[#11142D] flex items-center gap-2">
                                <Sparkles className="text-[#6C5DD3]" size={22} fill="#6C5DD3" fillOpacity={0.2} />
                                Gemini AI 工作室
                            </h3>
                            <p className="text-xs text-[#808191] mt-1 font-bold">创意生成引擎 • {aiState.isGenerating ? '思考中...' : '准备就绪'}</p>
                        </div>
                        <div className="flex bg-[#F0EFFB] p-1 rounded-xl">
                            <button 
                                onClick={() => setActiveTab('copy')} 
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'copy' ? 'bg-white text-[#6C5DD3] shadow-sm' : 'text-[#808191] hover:text-[#6C5DD3]'}`}
                            >
                                文案优化
                            </button>
                            <button 
                                onClick={() => setActiveTab('script')} 
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'script' ? 'bg-white text-[#6C5DD3] shadow-sm' : 'text-[#808191] hover:text-[#6C5DD3]'}`}
                            >
                                视频脚本
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    
                    {aiState.error && (
                        <div className="bg-[#FFE5D3] border border-[#FF754C]/20 text-[#FF754C] px-4 py-3 rounded-xl text-sm flex items-center gap-3 font-bold">
                            <div className="w-2 h-2 bg-[#FF754C] rounded-full animate-pulse"></div>
                            {aiState.error}
                        </div>
                    )}

                    {activeTab === 'copy' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Step 1 */}
                            <div className="bg-white rounded-[24px] border border-[#E4E4E4] shadow-sm p-6 relative group hover:border-[#6C5DD3]/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <LabelTag icon={Terminal} text="SEO 关键词 (Keywords)" />
                                    <button onClick={generateKeywords} disabled={aiState.isGenerating} className="text-xs bg-[#6C5DD3] text-white px-4 py-2 rounded-xl hover:bg-[#5a4cb5] font-bold transition-colors shadow-md shadow-indigo-200">
                                        自动提取
                                    </button>
                                </div>
                                <div className="relative">
                                    <textarea 
                                        value={aiState.keywords}
                                        onChange={(e) => setAiState(p => ({...p, keywords: e.target.value}))}
                                        placeholder="AI 将自动提取高流量 SEO 关键词..."
                                        className="w-full bg-[#F9FAFC] border-none rounded-2xl p-4 text-sm font-semibold text-[#11142D] focus:ring-2 focus:ring-[#E2E0F5] outline-none resize-none h-20 placeholder:text-[#B2B3BD]"
                                    />
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className={`bg-white rounded-[24px] border border-[#E4E4E4] shadow-sm p-6 relative transition-all ${!aiState.keywords ? 'opacity-60 grayscale' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <LabelTag icon={Wand2} text="Listing 标题 (Title)" />
                                    <button onClick={generateTitle} disabled={!aiState.keywords || aiState.isGenerating} className="text-xs bg-[#11142D] text-white px-4 py-2 rounded-xl hover:bg-black font-bold transition-colors shadow-lg">
                                        生成标题
                                    </button>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={aiState.title}
                                        readOnly
                                        placeholder="等待关键词生成..."
                                        className="w-full bg-[#F9FAFC] border-none rounded-2xl p-4 pr-12 text-sm font-bold text-[#11142D] focus:ring-0 outline-none placeholder:text-[#B2B3BD]"
                                    />
                                    {aiState.title && <button onClick={() => copyToClipboard(aiState.title)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg transition-colors text-[#808191] hover:text-[#6C5DD3]"><Copy size={16}/></button>}
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className={`bg-white rounded-[24px] border border-[#E4E4E4] shadow-sm p-6 relative transition-all ${!aiState.title ? 'opacity-60 grayscale' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <LabelTag icon={CheckCircle2} text="商品描述 (Description)" />
                                    <button onClick={generateDesc} disabled={!aiState.title || aiState.isGenerating} className="text-xs bg-[#11142D] text-white px-4 py-2 rounded-xl hover:bg-black font-bold transition-colors shadow-lg">
                                        生成描述
                                    </button>
                                </div>
                                <div className="relative group/desc">
                                    <div className="w-full bg-[#F9FAFC] rounded-2xl p-5 min-h-[200px] text-sm leading-relaxed text-[#5F616E] whitespace-pre-wrap font-medium">
                                        {aiState.description || <span className="text-[#B2B3BD] italic">内容将显示在这里...</span>}
                                    </div>
                                    {aiState.description && <button onClick={() => copyToClipboard(aiState.description)} className="absolute right-4 top-4 p-2 bg-white shadow-sm border border-[#E4E4E4] rounded-lg transition-colors text-[#808191] hover:text-[#6C5DD3] opacity-0 group-hover/desc:opacity-100"><Copy size={16}/></button>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'script' && (
                        <div className="animate-fade-in h-full flex flex-col">
                            <div className="bg-[#6C5DD3] rounded-[24px] p-8 text-white shadow-xl shadow-indigo-200 mb-8 flex items-center justify-between relative overflow-hidden">
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                                        <PlayCircle size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-xl">UGC 视频脚本生成器</h3>
                                        <p className="text-indigo-100 text-sm mt-1 font-medium">快速生成 30秒 病毒式带货短视频创意</p>
                                    </div>
                                </div>
                                <button onClick={generateScript} disabled={aiState.isGenerating} className="relative z-10 bg-white text-[#6C5DD3] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#F0EFFB] transition-colors shadow-lg">
                                    {aiState.isGenerating ? '思考中...' : '生成脚本'}
                                </button>

                                {/* Deco */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                            </div>

                            {aiState.script ? (
                                <div className="bg-[#1F2128] rounded-[24px] p-0 overflow-hidden shadow-2xl flex-1 flex flex-col">
                                    <div className="bg-[#2C3039] px-6 py-3 flex items-center gap-2 border-b border-white/5">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                        </div>
                                        <span className="text-[11px] text-[#808191] font-mono ml-4">viral_script.md</span>
                                        <button onClick={() => copyToClipboard(aiState.script)} className="ml-auto text-[#808191] hover:text-white"><Copy size={16} /></button>
                                    </div>
                                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                        <pre className="font-mono text-sm text-[#E4E4E4] whitespace-pre-wrap leading-7 font-ligatures">
                                            {aiState.script}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 border-2 border-dashed border-[#E4E4E4] rounded-[24px] flex flex-col items-center justify-center text-[#808191]">
                                    <Wand2 size={48} className="text-[#D1D1D1] mb-4" />
                                    <p className="font-bold text-lg">准备好开始创作了吗？</p>
                                    <p className="text-sm">点击上方按钮生成脚本</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};