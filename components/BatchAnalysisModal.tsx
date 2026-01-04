import React, { useState, useRef } from 'react';
import { Product, BatchResult } from '../types';
import { streamAIResponse } from '../services/aiService';
import { X, Play, Loader2, CheckCircle2, AlertCircle, Copy, FileText, Layers, Video, AlignLeft, Type, RefreshCw, ChevronRight } from 'lucide-react';

interface BatchAnalysisModalProps {
  products: Product[];
  savedResults: Record<string, BatchResult>;
  onUpdateResult: (result: BatchResult) => void;
  onClose: () => void;
  apiKey: string;
}

export const BatchAnalysisModal: React.FC<BatchAnalysisModalProps> = ({ products, savedResults, onUpdateResult, onClose, apiKey }) => {
  // Initialize local list with either saved result or pending state
  const [results, setResults] = useState<BatchResult[]>(
    products.map(p => savedResults[p.id] || {
        productId: p.id,
        productName: p.title,
        status: 'pending'
    })
  );

  // Default to first product selected
  const [selectedResultId, setSelectedResultId] = useState<string>(products[0]?.id || '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<'en' | 'zh'>('en'); // Language Toggle
  
  const isCancelled = useRef(false);

  // --- REUSABLE GENERATOR FUNCTION ---
  const generateContentForProduct = async (item: BatchResult): Promise<BatchResult> => {
      try {
        // Refined Prompt for "Human-like" and "Viral" output
        const prompt = `You are a top-tier TikTok Shop copywriter. I need you to act like a real, experienced human seller, not an AI. 
        Target Product: "${item.productName}"
        
        Guidelines:
        1.  **Tone**: Enthusiastic, authentic, urgent, and emotional. Use natural language (slang where appropriate for TikTok). 
        2.  **Logic**: Focus on "Hook -> Pain Point -> Solution -> Social Proof -> Call to Action".
        3.  **Formatting**: strict JSON output. NO markdown code blocks. NO asterisks (**) or hashes (#). Use real Emojis.
        4.  **Bilingual**: Generate distinct, native-sounding versions for English and Chinese. Do not just translate literally.

        Required JSON Structure:
        {
          "title_en": "Viral SEO Title (English, 1 emoji, max 80 chars, focus on benefit)",
          "title_zh": "爆款 SEO 标题 (中文, 1个表情, 突出痛点解决)",
          "description_en": "High-converting description (approx 200 words). \n- Paragraph 1: Emotional Hook/Pain Point. \n- Paragraph 2: Key Features using bullet points (use emojis as bullets). \n- Paragraph 3: Urgency/CTA.",
          "description_zh": "高转化商品详情 (约200字). \n- 第一段: 黄金3秒钩子/痛点直击. \n- 第二段: 核心卖点列表 (用表情符号做列表头). \n- 第三段: 促销紧迫感/引导下单.",
          "script_en": "30s Viral Video Script. \nScene 1 (0-3s): Visual Hook. \nScene 2 (3-15s): Demonstration/Problem Solving. \nScene 3 (15-25s): Value Proposition. \nScene 4 (25-30s): Strong CTA.",
          "script_zh": "30秒带货短视频脚本. \n镜头1 (0-3s): 视觉冲击/矛盾冲突. \n镜头2 (3-15s): 产品演示/解决问题. \n镜头3 (15-25s): 价值升华/信任背书. \n镜头4 (25-30s): 引导关注下单."
        }
        
        Output ONLY the valid JSON object.`;
        
        let fullText = "";
        await streamAIResponse(apiKey, prompt, 0.85, (chunk) => { // Higher temp for creativity
            fullText = chunk;
        });

        let cleanJson = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
        // Fallback cleanup if AI adds text before/after JSON
        const jsonStart = cleanJson.indexOf('{');
        const jsonEnd = cleanJson.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(cleanJson);

        const completedState: BatchResult = { 
            ...item, 
            status: 'completed', 
            contentEn: {
                title: parsed.title_en,
                description: parsed.description_en,
                script: parsed.script_en
            },
            contentZh: {
                title: parsed.title_zh,
                description: parsed.description_zh,
                script: parsed.script_zh
            }
        };

        return completedState;

    } catch (e: any) {
        console.error("Gen Error", e);
        const failedState: BatchResult = { ...item, status: 'failed', errorMsg: "生成失败，请检查网络或重试" };
        return failedState;
    }
  };

  // --- BATCH PROCESS ---
  const startBatch = async () => {
    if (!apiKey) { alert("请先输入 API Key"); return; }
    setIsProcessing(true);
    isCancelled.current = false;

    for (let i = 0; i < results.length; i++) {
        if (isCancelled.current) break;
        const item = results[i];
        if (item.status === 'completed') continue;

        setCurrentProcessingId(item.productId);
        // Set UI to processing
        setResults(prev => prev.map(r => r.productId === item.productId ? { ...r, status: 'processing' as const } : r));

        // Generate
        const finalState = await generateContentForProduct(item);
        
        // Update
        setResults(prev => prev.map(r => r.productId === item.productId ? finalState : r));
        onUpdateResult(finalState);
    }
    setIsProcessing(false);
    setCurrentProcessingId(null);
  };

  // --- REGENERATE SINGLE ITEM ---
  const handleRegenerate = async () => {
      const itemToRegen = results.find(r => r.productId === selectedResultId);
      if (!itemToRegen || !apiKey) return;

      // Update Local State to Loading
      setResults(prev => prev.map(r => r.productId === selectedResultId ? { ...r, status: 'processing' as const } : r));
      
      // Call Gen
      const finalState = await generateContentForProduct(itemToRegen);

      // Update State
      setResults(prev => prev.map(r => r.productId === selectedResultId ? finalState : r));
      onUpdateResult(finalState);
  };

  const copyResult = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const completedCount = results.filter(r => r.status === 'completed').length;
  const activeResult = results.find(r => r.productId === selectedResultId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#11142D]/60 backdrop-blur-md p-4">
        <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col border border-[#E4E4E4] animate-scale-in overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-[#F0F0F0] flex justify-between items-center bg-white z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF754C] text-white flex items-center justify-center shadow-lg shadow-orange-200">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-[#11142D]">AI 批量生成中心</h2>
                        <p className="text-sm text-[#808191] font-bold">队列中: {products.length} 个商品 | 已完成: {completedCount}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                     {/* Language Toggle */}
                     <div className="bg-[#F0EFFB] p-1 rounded-lg flex items-center border border-indigo-50">
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

                    <div className="flex gap-3">
                        {!isProcessing && completedCount < products.length && (
                            <button 
                                onClick={startBatch}
                                className="flex items-center gap-2 px-6 py-3 bg-[#6C5DD3] text-white rounded-xl font-bold hover:bg-[#5a4cb5] shadow-lg shadow-indigo-200 transition-all"
                            >
                                <Play size={16} fill="currentColor" /> 开始生成
                            </button>
                        )}
                        {isProcessing && (
                             <button className="flex items-center gap-2 px-6 py-3 bg-[#F0EFFB] text-[#6C5DD3] rounded-xl font-bold cursor-wait">
                                <Loader2 size={16} className="animate-spin" /> 正在处理...
                            </button>
                        )}
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#F9FAFC] text-[#808191] hover:text-[#11142D] flex items-center justify-center transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content - Split View */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#F9FAFC]">
                
                {/* LEFT: Selection List */}
                <div className="w-full md:w-1/4 border-r border-[#E4E4E4] overflow-y-auto custom-scrollbar bg-white p-3 space-y-2">
                    {results.map((item, idx) => (
                        <div 
                            key={item.productId}
                            onClick={() => setSelectedResultId(item.productId)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all relative group ${
                                selectedResultId === item.productId 
                                ? 'bg-[#F0EFFB] border-[#6C5DD3] shadow-sm' 
                                : 'bg-white border-transparent hover:bg-[#F9FAFC] hover:border-[#F0F0F0]'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${selectedResultId === item.productId ? 'bg-white border-[#E2E0F5] text-[#6C5DD3]' : 'bg-[#F9FAFC] border-[#F0F0F0] text-[#808191]'}`}>
                                    #{idx + 1}
                                </span>
                                {item.status === 'pending' && <span className="text-[10px] font-bold text-[#808191]">Waiting</span>}
                                {item.status === 'processing' && <Loader2 size={14} className="animate-spin text-[#6C5DD3]" />}
                                {item.status === 'completed' && <CheckCircle2 size={16} className="text-[#2F9042]" />}
                                {item.status === 'failed' && <AlertCircle size={16} className="text-[#FF754C]" />}
                            </div>
                            <h4 className={`font-bold text-xs line-clamp-2 leading-relaxed ${selectedResultId === item.productId ? 'text-[#11142D]' : 'text-[#808191] group-hover:text-[#11142D]'}`}>
                                {item.productName}
                            </h4>
                            {selectedResultId === item.productId && (
                                <ChevronRight size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6C5DD3] opacity-50" />
                            )}
                        </div>
                    ))}
                </div>

                {/* RIGHT: Active Result View */}
                <div className="w-full md:w-3/4 p-8 overflow-y-auto custom-scrollbar bg-[#F9FAFC]">
                     
                     {/* Empty State / Select Prompt */}
                     {!activeResult && (
                        <div className="h-full flex flex-col items-center justify-center text-[#808191] opacity-50">
                             <Layers size={64} className="mb-4 text-[#D1D1D1]" />
                             <p className="font-bold">Select a product to view AI results</p>
                        </div>
                     )}

                     {activeResult && (
                        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                            
                            {/* Product Header Card */}
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E4E4E4] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-[#6C5DD3] flex items-center justify-center text-white text-lg font-bold">
                                        {activeResult.productName.charAt(0)}
                                     </div>
                                     <div>
                                         <h3 className="font-extrabold text-[#11142D] text-lg line-clamp-1 max-w-md" title={activeResult.productName}>{activeResult.productName}</h3>
                                         <p className="text-xs font-bold text-[#808191] mt-1">
                                            {activeResult.status === 'completed' ? 'AI Generation Complete' : activeResult.status === 'processing' ? 'AI Thinking...' : 'Waiting in Queue'}
                                         </p>
                                     </div>
                                </div>
                                {activeResult.status === 'completed' && (
                                    <button 
                                        onClick={handleRegenerate}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F0EFFB] text-[#6C5DD3] font-bold text-xs hover:bg-[#E2E0F5] transition-colors"
                                    >
                                        <RefreshCw size={14} /> 重新生成 (Regenerate)
                                    </button>
                                )}
                            </div>

                            {/* Processing State */}
                            {activeResult.status === 'processing' && (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-[#F0EFFB] border-t-[#6C5DD3] rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles size={20} className="text-[#6C5DD3] animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-[#11142D] font-bold text-lg">正在为该商品生成爆款文案...</p>
                                    <p className="text-[#808191] text-sm mt-2">AI 正在模拟真人卖家口吻</p>
                                </div>
                            )}

                            {/* Pending State */}
                            {activeResult.status === 'pending' && (
                                <div className="flex flex-col items-center justify-center py-20 text-[#808191]">
                                    <FileText size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">等待生成...</p>
                                    <p className="text-xs mt-2">点击顶部 "开始生成" 启动队列</p>
                                </div>
                            )}

                            {/* Failed State */}
                            {activeResult.status === 'failed' && (
                                <div className="bg-[#FFF0E6] p-6 rounded-2xl border border-[#FF754C]/20 text-center">
                                    <AlertCircle size={32} className="text-[#FF754C] mx-auto mb-3" />
                                    <p className="text-[#FF754C] font-bold">生成失败</p>
                                    <button onClick={handleRegenerate} className="mt-3 text-xs underline text-[#FF754C] font-bold">重试</button>
                                </div>
                            )}

                            {/* Completed Content */}
                            {activeResult.status === 'completed' && activeResult.contentEn && activeResult.contentZh && (
                                <>
                                    {(() => {
                                        const content = targetLang === 'en' ? activeResult.contentEn : activeResult.contentZh;
                                        return (
                                            <div className="space-y-6">
                                                {/* Title Section */}
                                                <div className="bg-white rounded-[24px] p-6 border border-[#E4E4E4] shadow-sm group hover:border-[#6C5DD3]/50 transition-all">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-2 text-[#6C5DD3] font-extrabold text-sm uppercase tracking-wider">
                                                            <Type size={16} />
                                                            <span>{targetLang === 'en' ? 'Viral Title' : '爆款标题'}</span>
                                                        </div>
                                                        <button onClick={() => copyResult(content.title)} className="text-[#808191] hover:text-[#6C5DD3] flex items-center gap-1.5 text-xs font-bold transition-colors bg-[#F9FAFC] px-3 py-1.5 rounded-lg">
                                                            <Copy size={12} /> 复制
                                                        </button>
                                                    </div>
                                                    <div className="text-lg font-bold text-[#11142D] leading-relaxed">
                                                        {content.title}
                                                    </div>
                                                </div>

                                                {/* Description Section */}
                                                <div className="bg-white rounded-[24px] p-6 border border-[#E4E4E4] shadow-sm group hover:border-[#FF754C]/50 transition-all">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-2 text-[#FF754C] font-extrabold text-sm uppercase tracking-wider">
                                                            <AlignLeft size={16} />
                                                            <span>{targetLang === 'en' ? 'Description' : '商品描述 (300字)'}</span>
                                                        </div>
                                                        <button onClick={() => copyResult(content.description)} className="text-[#808191] hover:text-[#6C5DD3] flex items-center gap-1.5 text-xs font-bold transition-colors bg-[#F9FAFC] px-3 py-1.5 rounded-lg">
                                                            <Copy size={12} /> 复制
                                                        </button>
                                                    </div>
                                                    <div className="text-[#5F616E] text-sm leading-8 whitespace-pre-wrap font-medium">
                                                        {content.description}
                                                    </div>
                                                </div>

                                                {/* Script Section */}
                                                <div className="bg-white rounded-[24px] p-6 border border-[#E4E4E4] shadow-sm group hover:border-[#2F9042]/50 transition-all">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-2 text-[#2F9042] font-extrabold text-sm uppercase tracking-wider">
                                                            <Video size={16} />
                                                            <span>{targetLang === 'en' ? 'Video Script' : '视频脚本'}</span>
                                                        </div>
                                                        <button onClick={() => copyResult(content.script)} className="text-[#808191] hover:text-[#6C5DD3] flex items-center gap-1.5 text-xs font-bold transition-colors bg-[#F9FAFC] px-3 py-1.5 rounded-lg">
                                                            <Copy size={12} /> 复制
                                                        </button>
                                                    </div>
                                                    <div className="bg-[#F9FAFC] rounded-xl p-5 border border-[#F0F0F0]">
                                                        <p className="text-[#5F616E] text-xs font-mono leading-7 whitespace-pre-wrap">{content.script}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </>
                            )}

                        </div>
                     )}
                </div>

            </div>
        </div>
    </div>
  );
};
// Helper for simple sparkles
const Sparkles = ({size, className}: {size: number, className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>
);