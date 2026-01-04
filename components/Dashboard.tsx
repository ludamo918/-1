import React, { useState, useEffect, useRef } from 'react';
import { Product, UserRole } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Trophy, Bell, Search, MessageCircle, ChevronDown, BarChart2, Activity, Heart, Layers, Zap, Globe, ShoppingBag, ExternalLink, Video, Newspaper, Calendar, Flame, Loader2, ArrowRight, RefreshCw, AlertCircle, Coins, ThumbsUp, Sparkles as SparklesIcon } from 'lucide-react';
import { calculateScore } from '../utils/helpers';
import { fetchRealTimeNews } from '../services/aiService';

interface DashboardProps {
  products: Product[];
  maxGmv: number;
  onSelectProduct: (product: Product) => void;
  userRole: UserRole | null;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpenBatchAI: () => void;
  userAvatar: string;
  apiKey: string;
}

// Data Definition for News Cards
interface NewsItem {
  id: string;
  name: string;
  url: string;
  icon: any;
  gradient: string;
  initialHeadline: string;
  tag: string;
}

const GLOBAL_NEWS: NewsItem[] = [
  { id: 'g1', name: '雨果跨境', url: 'https://www.cifnews.com/', icon: Newspaper, gradient: 'from-blue-500 via-blue-600 to-blue-700', initialHeadline: 'TikTok Shop美区黑五GMV创新高，全托管模式引爆增长', tag: '最新战报' },
  { id: 'g2', name: '白鲸出海', url: 'https://www.baijing.cn/', icon: TrendingUp, gradient: 'from-violet-500 via-purple-500 to-fuchsia-500', initialHeadline: '2025泛娱乐出海洞察白皮书发布，新兴市场潜力巨大', tag: '深度报告' },
  { id: 'g3', name: '创意中心', url: 'https://ads.tiktok.com/business/creativecenter/', icon: Video, gradient: 'from-pink-500 via-rose-500 to-red-500', initialHeadline: '本周 Top Ads: 美妆个护类目飙升，UGC素材转化率翻倍', tag: '趋势榜单' },
  { id: 'g4', name: '节日日历', url: 'https://www.timeanddate.com/holidays/', icon: Calendar, gradient: 'from-emerald-400 via-green-500 to-teal-600', initialHeadline: '距离 Valentine\'s Day 还有 39 天，备货窗口期开启', tag: '选品节点' },
];

const CHINA_NEWS: NewsItem[] = [
  { id: 'c1', name: '亿邦动力', url: 'https://www.ebrun.com/', icon: Activity, gradient: 'from-orange-400 via-orange-500 to-red-500', initialHeadline: '淘宝推出“全托管”新流量扶持计划，中小商家迎利好', tag: '平台政策' },
  { id: 'c2', name: '派代网', url: 'http://www.paidai.com/', icon: Layers, gradient: 'from-cyan-500 via-sky-500 to-blue-600', initialHeadline: '中小卖家如何突围2025年货节？运营实操SOP全解析', tag: '干货分享' },
  { id: 'c3', name: '营销日历', url: 'https://socialbeta.com/', icon: Calendar, gradient: 'from-fuchsia-500 via-pink-500 to-rose-500', initialHeadline: '2025春节CNY营销案例大赏，国潮元素成为主流', tag: '营销热点' },
  { id: 'c4', name: '微博热搜', url: 'https://s.weibo.com/top/summary', icon: Flame, gradient: 'from-yellow-400 via-amber-500 to-orange-600', initialHeadline: '热搜: 董宇辉新号带货破亿，直播电商下半场怎么玩', tag: '实时热点' },
];

export const Dashboard: React.FC<DashboardProps> = ({ products, maxGmv, onSelectProduct, userRole, favorites, onToggleFavorite, onOpenBatchAI, userAvatar, apiKey }) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  
  // --- Feedback / Coin Jar Logic ---
  const [coinCount, setCoinCount] = useState(0);
  const [flyingCoins, setFlyingCoins] = useState<{id: number}[]>([]);
  const [isJarShaking, setIsJarShaking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false); // Track if user liked

  // Load initial coins and user status from local storage
  useEffect(() => {
      // Changed keys to v2 to enforce reset ("清零")
      const savedCoins = localStorage.getItem('tk_pro_global_likes_v2');
      const userLiked = localStorage.getItem('tk_pro_user_has_liked_v2');
      
      if (savedCoins) {
          setCoinCount(parseInt(savedCoins, 10));
      } else {
          setCoinCount(0); // Start from 0
      }

      if (userLiked === 'true') {
          setHasLiked(true);
      }
  }, []);

  const handleAddCoin = () => {
    if (hasLiked) return; // Prevent duplicate likes

    // 1. Update UI State
    const newCount = coinCount + 1;
    setCoinCount(newCount);
    setHasLiked(true);
    setIsJarShaking(true);
    setTimeout(() => setIsJarShaking(false), 300);

    // 2. Animation Trigger
    const coinId = Date.now();
    setFlyingCoins(prev => [...prev, { id: coinId }]);
    setTimeout(() => {
        setFlyingCoins(prev => prev.filter(c => c.id !== coinId));
    }, 800);

    // 3. Persist Locally
    localStorage.setItem('tk_pro_global_likes_v2', newCount.toString());
    localStorage.setItem('tk_pro_user_has_liked_v2', 'true');

    // 4. Send to Backend (Mock Real-time Feedback)
    if (navigator.onLine) {
        console.log(`[User Feedback] User donated a coin! Total: ${newCount}. Synced to server.`);
    }
  };
  // ---------------------------------

  const totalGmv = products.reduce((sum, p) => sum + p.gmv, 0);
  const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
  const maxSales = products.length > 0 ? Math.max(...products.map(p => p.sales)) : 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const top3 = [...products].sort((a, b) => b.gmv - a.gmv).slice(0, 3);
  
  const chartData = [...products]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 15)
    .map(p => ({
      name: p.title.length > 10 ? p.title.substring(0, 10) + '...' : p.title,
      fullTitle: p.title,
      sales: p.sales,
      gmv: p.gmv,
      product: p
    }));

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Fireworks Canvas Logic
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        alpha: number;
        color: string;
        size: number;
        decay: number;

        constructor(x: number, y: number, color: string) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.alpha = 1;
            this.color = color;
            this.size = Math.random() * 2 + 1;
            this.decay = Math.random() * 0.015 + 0.01;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.05; // gravity
            this.alpha -= this.decay;
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    const colors = ['#FF0080', '#FF8C00', '#40E0D0', '#FFD700', '#7B68EE', '#00FA9A'];

    const createFirework = () => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.8);
        const color = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(x, y, color));
        }
    };

    const loop = () => {
        // Semi-transparent clear for trail effect
        ctx.fillStyle = 'rgba(17, 20, 45, 0.2)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Randomly launch fireworks
        if (Math.random() < 0.05) {
            createFirework();
        }

        particles.forEach((p, index) => {
            p.update();
            p.draw(ctx);
            if (p.alpha <= 0) {
                particles.splice(index, 1);
            }
        });

        animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Modern Stat Card
  const StatCard = ({ title, value, subtext, trend, icon: Icon, colorClass, bgClass, glowClass }: any) => {
    return (
      <div className="bg-white p-8 rounded-[24px] shadow-[0_10px_30px_rgba(200,200,230,0.1)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group border border-[#F0F0F0]">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 translate-x-10 -translate-y-10 ${glowClass}`}></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className={`w-14 h-14 rounded-2xl ${bgClass} flex items-center justify-center text-white shadow-lg`}>
            <Icon size={28} strokeWidth={2.5} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${trend > 0 ? 'bg-[#E2FBD7] text-[#2F9042]' : 'bg-[#FFE5D3] text-[#FF754C]'}`}>
              {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="relative z-10">
          <h2 className="text-[32px] font-extrabold text-[#11142D] tracking-tight leading-tight">{value}</h2>
          <p className="text-[#808191] text-sm font-bold mt-1 uppercase tracking-wide">{title}</p>
        </div>
      </div>
    );
  };

  // Reusable News Card Component with Real Data Fetching
  const NewsCard = ({ item }: { item: NewsItem }) => {
    const [headline, setHeadline] = useState(item.initialHeadline);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    // Initial load simulation (just purely visual delay to look nicer on load)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleRefresh = async (e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        if (!apiKey) {
            alert("请在侧边栏输入您的 API Key 以启用实时搜索功能。");
            return;
        }

        setIsLoading(true);
        setError(false);
        
        try {
            const freshHeadline = await fetchRealTimeNews(apiKey, item.name, item.tag);
            setHeadline(freshHeadline);
        } catch (err) {
            setError(true);
            setTimeout(() => setError(false), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <a href={item.url} target="_blank" rel="noreferrer" className={`relative rounded-2xl p-4 bg-gradient-to-br ${item.gradient} text-white shadow-lg shadow-black/5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden border border-white/10`}>
            {/* Glow Effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/30 transition-all"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                            <item.icon size={16} className="text-white" />
                        </div>
                        <span className="font-extrabold text-sm tracking-wide text-shadow-sm">{item.name}</span>
                    </div>
                    {/* Arrow for link */}
                    <ArrowRight size={14} className="opacity-60 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="space-y-2 min-h-[3rem] flex flex-col justify-center">
                    {isLoading ? (
                        <div className="flex items-center gap-2 opacity-80 animate-pulse">
                            <Loader2 size={12} className="animate-spin" />
                            <span className="text-[10px] font-medium">AI 正在全网搜索最新头条...</span>
                        </div>
                    ) : error ? (
                         <div className="flex items-center gap-2 text-white/80">
                            <AlertCircle size={12} />
                            <span className="text-[10px] font-medium">获取失败，请重试</span>
                        </div>
                    ) : (
                        <p className="text-[11px] font-bold leading-tight opacity-95 line-clamp-2">
                            {headline}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/20">
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white/90">
                        {item.tag}
                    </span>
                    {/* Refresh Button */}
                    <button 
                        onClick={handleRefresh}
                        className="p-1.5 rounded-md hover:bg-white/20 transition-colors group/refresh"
                        title="点击获取最新实时资讯 (Real-time Fetch)"
                    >
                        <RefreshCw size={12} className={`text-white/80 group-hover/refresh:text-white ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </a>
    );
  };

  return (
    <div className="space-y-10 pb-12 animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
              <h1 className="text-3xl font-extrabold text-[#11142D]">仪表盘 (Dashboard)</h1>
              <p className="text-[#808191] font-medium mt-1">首页 / <span className="text-[#6C5DD3]">数据分析</span></p>
          </div>
          
          <div className="flex items-center gap-5 bg-white p-2 pl-6 pr-2 rounded-[20px] shadow-sm shadow-slate-100">
               {/* Search Pill */}
               <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                   <Search size={20} className="text-[#808191]" />
                   <input type="text" placeholder="搜索商品..." className="bg-transparent outline-none text-sm font-semibold text-[#11142D] placeholder-[#808191] w-full" />
               </div>

               <div className="flex items-center gap-3 border-l border-[#F0F0F0] pl-5">
                   {/* Notification Icons */}
                   <button className="w-10 h-10 rounded-full bg-[#F9FAFC] hover:bg-[#F0EFFB] flex items-center justify-center text-[#808191] hover:text-[#6C5DD3] transition-colors relative">
                       <MessageCircle size={20} />
                       <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#FF754C] rounded-full border border-white"></span>
                   </button>
                   <button className="w-10 h-10 rounded-full bg-[#F9FAFC] hover:bg-[#F0EFFB] flex items-center justify-center text-[#808191] hover:text-[#6C5DD3] transition-colors relative">
                       <Bell size={20} />
                       <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#FF754C] rounded-full border border-white"></span>
                   </button>

                   {/* User Profile */}
                   <div className="flex items-center gap-3 pl-2 cursor-pointer">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#E4E4E4]">
                             <img src={userAvatar} alt="User" className="w-full h-full object-cover grayscale" />
                        </div>
                        <ChevronDown size={16} className="text-[#808191]" />
                   </div>
               </div>
          </div>
      </div>

      {/* NEW CELEBRATION BANNER WITH FEEDBACK JAR */}
      <div className="relative w-full h-36 md:h-48 rounded-[30px] overflow-hidden shadow-xl group border border-[#11142D]/10">
          {/* Canvas Background for Fireworks */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-[#11142D]" />
          
          {/* Main Container */}
          <div className="absolute inset-0 z-10 bg-black/10 backdrop-blur-[1px] flex items-center px-4 md:px-16">
               
               {/* Left Side: Daily Mood/Badge (Optional decoration for left circle area) */}
               <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <SparklesIcon size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">今日能量</p>
                        <p className="text-white font-extrabold text-sm">火力全开 🔥</p>
                    </div>
               </div>

               {/* Center Text */}
               <h1 className="w-full text-center text-3xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-2xl">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF0080] via-[#FF8C00] to-[#00FA9A] animate-gradient-x" style={{ textShadow: '0 0 30px rgba(255,255,255,0.3)' }}>
                     少年阿闯 预祝各位兄弟姐妹2026爆单大卖♥️
                  </span>
               </h1>

               {/* Right Side: Interactive Coin Jar (Feedback) */}
               <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 flex flex-col items-center">
                   
                   {/* Flying Coins Animation Container */}
                   <div className="absolute bottom-16 w-full h-20 pointer-events-none overflow-visible">
                        {flyingCoins.map((c) => (
                            <div key={c.id} className="absolute left-1/2 -translate-x-1/2 animate-bounce opacity-0" style={{ animation: 'floatUp 0.8s ease-out forwards' }}>
                                <Coins size={24} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" fill="currentColor" />
                            </div>
                        ))}
                   </div>

                   {/* The Jar Button */}
                   <button 
                      onClick={handleAddCoin}
                      disabled={hasLiked}
                      className={`relative group/jar bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl transition-all duration-200 ${hasLiked ? 'cursor-default opacity-80' : 'hover:bg-white/20 active:scale-95 cursor-pointer'} ${isJarShaking ? 'animate-wiggle' : ''}`}
                      title={hasLiked ? "您已点赞 (You have already liked)" : "点击投币反馈 (Click to Donate Coin/Like)"}
                   >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-shadow ${hasLiked ? 'bg-gradient-to-br from-gray-300 to-gray-400 grayscale' : 'bg-gradient-to-br from-yellow-300 to-yellow-600 group-hover/jar:shadow-[0_0_30px_rgba(234,179,8,0.8)]'}`}>
                                    <ThumbsUp size={24} className="text-white -rotate-12" fill="currentColor" />
                                </div>
                                {/* Ping animation only if not liked yet */}
                                {!hasLiked && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#11142D] animate-ping"></div>}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-wide">存钱罐 (Likes)</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-white font-mono tracking-tighter" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                                        {coinCount.toLocaleString()}
                                    </span>
                                    {hasLiked ? (
                                        <span className="text-xs text-white/50 font-bold ml-1">已赞</span>
                                    ) : (
                                        <span className="text-xs text-yellow-400 font-bold">+1</span>
                                    )}
                                </div>
                            </div>
                        </div>
                   </button>

                   {/* Tooltip hint */}
                   <p className="mt-2 text-[10px] text-white/40 font-bold tracking-widest uppercase">
                       点赞积攒好运
                   </p>
               </div>
          </div>
          
          {/* Custom Styles for Animation */}
          <style>{`
            @keyframes floatUp {
                0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
                20% { opacity: 1; transform: translate(-50%, -20px) scale(1.2); }
                100% { transform: translate(-50%, -60px) scale(1); opacity: 0; }
            }
            @keyframes wiggle {
                0%, 100% { transform: rotate(-3deg); }
                50% { transform: rotate(3deg); }
            }
            .animate-wiggle {
                animation: wiggle 0.2s ease-in-out infinite;
            }
          `}</style>
      </div>

      {/* Optimized Toolbox Section (Colored Cards) */}
      <div className="bg-[#6C5DD3] text-white p-8 rounded-[30px] shadow-lg shadow-indigo-300 relative overflow-hidden">
          
          {/* Background Decor */}
          <div className="absolute top-[-50%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-50%] left-[-5%] w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-8">
              
              {/* Row 1: Global News */}
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-200 text-xs font-extrabold uppercase tracking-widest">
                          <Globe size={14} />
                          <span>国外跨境资讯 (Global News)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] bg-white/10 px-2 py-1 rounded-lg backdrop-blur-md">
                         <span className="w-1.5 h-1.5 rounded-full bg-[#00FA9A] animate-pulse"></span>
                         <span>支持 AI 实时搜索</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {GLOBAL_NEWS.map(item => (
                          <NewsCard key={item.id} item={item} />
                      ))}
                  </div>
              </div>

              {/* Row 2: China News */}
              <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-200 text-xs font-extrabold uppercase tracking-widest">
                      <ShoppingBag size={14} />
                      <span>国内电商资讯 (China News)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {CHINA_NEWS.map(item => (
                          <NewsCard key={item.id} item={item} />
                      ))}
                  </div>
              </div>

          </div>
      </div>

      {/* KPI Stats Grid - Larger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="总交易额 (Total GMV)" 
          value={formatCurrency(totalGmv)} 
          trend={12.5}
          icon={DollarSign} 
          bgClass="bg-[#6C5DD3]"
          glowClass="bg-[#6C5DD3]"
        />
        <StatCard 
          title="平均客单价 (Avg Price)" 
          value={`$${avgPrice.toFixed(2)}`} 
          trend={-2.4}
          icon={ShoppingCart} 
          bgClass="bg-[#3F8CFF]"
          glowClass="bg-[#3F8CFF]"
        />
        <StatCard 
          title="活跃商品数 (SKUs)" 
          value={products.length} 
          trend={5.8}
          icon={Package} 
          bgClass="bg-[#FF754C]"
          glowClass="bg-[#FF754C]"
        />
        <StatCard 
          title="最高销量 (Max Sales)" 
          value={maxSales.toLocaleString()} 
          trend={24}
          icon={Trophy} 
          bgClass="bg-[#FFCD54]"
          glowClass="bg-[#FFCD54]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart with Toggle */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F0F0F0]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-[#11142D]">销售分析 (Sales Analytics)</h3>
              <p className="text-[#808191] text-sm mt-1 font-semibold">销量 Top 15 商品表现</p>
            </div>
            <div className="flex bg-[#F9FAFC] p-1.5 rounded-xl border border-[#F0F0F0]">
               <button 
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white text-[#6C5DD3] shadow-sm' : 'text-[#808191] hover:text-[#6C5DD3]'}`}
                title="柱状图"
               >
                 <BarChart2 size={18} strokeWidth={2.5} />
               </button>
               <button 
                onClick={() => setChartType('line')}
                className={`p-2 rounded-lg transition-all ${chartType === 'line' ? 'bg-white text-[#6C5DD3] shadow-sm' : 'text-[#808191] hover:text-[#6C5DD3]'}`}
                title="趋势图"
               >
                 <Activity size={18} strokeWidth={2.5} />
               </button>
            </div>
          </div>
          
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                  <BarChart data={chartData} barSize={32}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6C5DD3" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#A096E8" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#808191', fontWeight: 600}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#808191', fontWeight: 600}} 
                    />
                    <Tooltip 
                      cursor={{fill: '#F9FAFC', radius: 8}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#11142D] text-white p-4 rounded-xl shadow-xl">
                              <p className="font-bold mb-2 text-sm">{data.fullTitle}</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">销量:</span>
                                    <span className="text-[#6C5DD3] font-mono font-bold">{data.sales.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">GMV:</span>
                                    <span className="text-[#FF754C] font-mono font-bold">${data.gmv.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="url(#colorSales)" 
                      radius={[8, 8, 8, 8]}
                      onClick={(data: any) => onSelectProduct(data.product)}
                      cursor="pointer"
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
              ) : (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSalesLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#808191', fontWeight: 600}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#808191', fontWeight: 600}} 
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#11142D] text-white p-4 rounded-xl shadow-xl">
                              <p className="font-bold mb-2 text-sm">{data.fullTitle}</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">销量:</span>
                                    <span className="text-[#6C5DD3] font-mono font-bold">{data.sales.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#6C5DD3" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSalesLine)" 
                        onClick={(data: any) => onSelectProduct(data.product)}
                        activeDot={{ r: 8, onClick: (e: any, payload: any) => onSelectProduct(payload.payload.product) }}
                        cursor="pointer"
                    />
                  </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Winners List */}
        <div className="bg-white rounded-[30px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F0F0F0] flex flex-col">
          <h3 className="text-xl font-extrabold text-[#11142D] mb-8 flex items-center gap-3">
             <span>Top 3 爆款 (Winners)</span>
             <span className="w-2 h-2 rounded-full bg-[#FF754C]"></span>
          </h3>

          <div className="space-y-5 flex-1">
            {top3.map((product, idx) => (
              <div 
                key={product.id} 
                onClick={() => onSelectProduct(product)}
                className="flex items-center gap-4 p-4 rounded-[20px] bg-white border border-[#F0F0F0] hover:border-[#6C5DD3] hover:shadow-lg hover:shadow-indigo-100 transition-all cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#F9FAFC] flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-[#808191]" />
                    )}
                  </div>
                  <div className={`absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                    idx === 0 ? 'bg-[#FFCD54]' : 
                    idx === 1 ? 'bg-[#96A0B5]' : 
                    'bg-[#FF754C]'
                  }`}>
                    #{idx + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold truncate text-[#11142D] group-hover:text-[#6C5DD3] transition-colors">{product.title}</h4>
                  <p className="text-xs text-[#808191] mt-1 font-semibold">${product.gmv.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 py-3 rounded-2xl bg-[#F0EFFB] text-[#6C5DD3] font-bold text-sm hover:bg-[#6C5DD3] hover:text-white transition-all">
             查看所有商品
          </button>
        </div>
      </div>

      {/* Advanced Data Table */}
      <div className="bg-white rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F0F0F0] overflow-hidden">
        <div className="px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
                <h3 className="text-xl font-extrabold text-[#11142D]">库存情报 (Inventory)</h3>
                <p className="text-sm text-[#808191] mt-1 font-semibold">SKU 综合表现分析</p>
            </div>
            {/* Batch AI Action in Header */}
            {favorites.size > 0 && (
                <button 
                    onClick={onOpenBatchAI}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF754C] text-white rounded-xl text-xs font-bold shadow-md hover:bg-orange-600 transition-all animate-scale-in"
                >
                    <Layers size={14} /> AI 批量生成 ({favorites.size})
                </button>
            )}
          </div>
          
          <div className="flex gap-3">
             {/* Legend */}
             <div className="hidden lg:flex items-center gap-3 mr-4">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#808191]">
                     <Heart size={12} className="text-[#FF754C]" fill="currentColor"/> 
                     <span>已收藏 (加入队列)</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#808191]">
                     <Heart size={12} className="text-[#E4E4E4]" /> 
                     <span>未收藏</span>
                 </div>
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto px-2 pb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[#808191] text-sm font-bold tracking-wider border-b border-[#F0F0F0]">
                <th className="px-4 py-5 pl-8 w-16">收藏</th>
                <th className="px-4 py-5">商品信息 (PRODUCT)</th>
                <th className="px-6 py-5">价格 (PRICE)</th>
                <th className="px-6 py-5">销量 (SALES)</th>
                <th className="px-6 py-5">总GMV</th>
                <th className="px-6 py-5">AI 评级</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {products.sort((a,b) => b.gmv - a.gmv).map((product) => {
                const { text, grade, colorClass, label } = calculateScore(product, maxGmv, maxSales);
                const isFav = favorites.has(product.id);
                
                return (
                <tr 
                  key={product.id} 
                  className={`transition-colors cursor-pointer group ${isFav ? 'bg-[#FFF0E6]/30' : 'hover:bg-[#F9FAFC]'}`}
                  onClick={() => onSelectProduct(product)}
                >
                  <td className="px-4 py-5 pl-8" onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-[#FF754C] text-white shadow-md shadow-orange-200' : 'bg-[#F0EFFB] text-[#E4E4E4] hover:text-[#FF754C] hover:bg-[#FFE5D3]'}`}>
                        <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                     </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[14px] bg-[#F0EFFB] shrink-0 overflow-hidden shadow-sm">
                         {product.imageUrl ? (
                           <img src={product.imageUrl} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-[#808191]"><Package size={24}/></div>
                         )}
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <p className={`font-bold text-base line-clamp-2 transition-colors ${isFav ? 'text-[#FF754C]' : 'text-[#11142D] group-hover:text-[#6C5DD3]'}`}>{product.title}</p>
                        <p className="text-sm text-[#808191] mt-1.5 font-bold">ID: {product.id.slice(0,8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-extrabold text-[#11142D] text-base">${product.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-base font-extrabold text-[#11142D]">{product.sales.toLocaleString()}</span>
                        <div className="w-24 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                             <div className="h-full bg-[#6C5DD3] rounded-full" style={{width: `${Math.min((product.sales / maxSales) * 100, 100)}%`}}></div>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-extrabold text-[#FF754C] text-base font-mono">${product.gmv.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-[10px] text-xs font-extrabold border shadow-sm ${colorClass}`}>
                           {text} ({grade})
                        </span>
                     </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};