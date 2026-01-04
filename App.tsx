import React, { useState, useEffect, useMemo } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { AnalysisRoom } from './components/AnalysisRoom';
import { BatchAnalysisModal } from './components/BatchAnalysisModal';
import { UserRole, Product, ColumnMapping, BatchResult } from './types';
import { cleanCurrency, parseCSV } from './utils/helpers';
import { UploadCloud, LogOut, Sliders, Home, Zap, Layers, CheckCircle2, Globe, ShoppingBag, ExternalLink, TrendingUp, Video, ShoppingCart, BarChart2, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';

// Demo Data to show if no file is uploaded
const DEMO_DATA: Product[] = [
    { id: '1', title: '星空投影灯 (Galaxy Projector)', price: 24.99, sales: 12500, gmv: 312375, imageUrl: 'https://picsum.photos/200/200?random=1', originalData: {} },
    { id: '2', title: '收腹塑身衣 (Shapewear)', price: 18.50, sales: 8900, gmv: 164650, imageUrl: 'https://picsum.photos/200/200?random=2', originalData: {} },
    { id: '3', title: '磁吸充电宝 (Magnetic Power Bank)', price: 12.99, sales: 5400, gmv: 70146, imageUrl: 'https://picsum.photos/200/200?random=3', originalData: {} },
    { id: '4', title: '便携热敏打印机 (Mini Printer)', price: 29.99, sales: 3200, gmv: 95968, imageUrl: 'https://picsum.photos/200/200?random=4', originalData: {} },
    { id: '5', title: '落日氛围灯 (Sunset Lamp)', price: 15.00, sales: 2100, gmv: 31500, imageUrl: 'https://picsum.photos/200/200?random=5', originalData: {} },
];

// Initial Default Avatar (Public URL)
export const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=e5e7eb&glassesProbability=0";

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [products, setProducts] = useState<Product[]>(DEMO_DATA);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ title: '', price: '', sales: '', image: '' });
  const [showMapping, setShowMapping] = useState(false);
  
  // Avatar State - Initialize from LocalStorage if available
  const [userAvatar, setUserAvatar] = useState<string>(() => {
      const saved = localStorage.getItem('tk_pro_avatar');
      return saved || DEFAULT_AVATAR;
  });
  
  // Favorites & Batch AI
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  // Persist Batch Results in App state
  const [batchResults, setBatchResults] = useState<Record<string, BatchResult>>({});
  
  // Settings
  const [apiKey, setApiKey] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [minSales, setMinSales] = useState(100);
  
  // State for Analysis Room
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);

  // Handle Avatar Change & Persist
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Update State
            setUserAvatar(base64String);
            // Save to LocalStorage
            try {
                localStorage.setItem('tk_pro_avatar', base64String);
            } catch (err) {
                console.error("Image too large to save to local storage", err);
                alert("图片太大无法永久保存，请使用小于 2MB 的图片");
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const processFileContent = (data: any[]) => {
      if (data.length > 0) {
        setRawHeaders(Object.keys(data[0]));
        const keys = Object.keys(data[0]);
        setMapping({
            title: keys.find(k => /title|name|名称|标题|商品/i.test(k)) || keys[0],
            price: keys.find(k => /price|价格|单价/i.test(k)) || keys[1] || keys[0],
            sales: keys.find(k => /sales|sold|销量|订单/i.test(k)) || keys[2] || keys[0],
            image: keys.find(k => /img|pic|cover|图/i.test(k)) || ''
        });
        setShowMapping(true);
        (window as any).tempRawData = data;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const rawData = parseCSV(text);
            processFileContent(rawData);
        };
        reader.readAsText(file);
    } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        processFileContent(rawData as any[]);
    }
  };

  const confirmMapping = () => {
    const rawData = (window as any).tempRawData;
    if (!rawData) return;
    const mappedProducts: Product[] = rawData.map((row: any, idx: number) => {
        const price = cleanCurrency(row[mapping.price]);
        const sales = cleanCurrency(row[mapping.sales]);
        return {
            id: `p-${idx}`,
            originalData: row,
            title: row[mapping.title] || 'Untitled',
            price: price,
            sales: sales,
            gmv: price * sales,
            imageUrl: mapping.image ? row[mapping.image] : undefined
        };
    });
    setProducts(mappedProducts);
    setShowMapping(false);
    const prices = mappedProducts.map(p => p.price);
    setPriceRange([Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
        p.price >= priceRange[0] && 
        p.price <= priceRange[1] && 
        p.sales >= minSales
    );
  }, [products, priceRange, minSales]);

  const maxGmv = useMemo(() => filteredProducts.length > 0 ? Math.max(...filteredProducts.map(p => p.gmv)) : 0, [filteredProducts]);
  const maxSales = useMemo(() => filteredProducts.length > 0 ? Math.max(...filteredProducts.map(p => p.sales)) : 0, [filteredProducts]);

  const getEnvApiKey = () => (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsAnalysisVisible(true);
  };

  const handleAnalysisClose = () => {
    setIsAnalysisVisible(false);
  };

  const toggleFavorite = (productId: string) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(productId)) {
        newFavs.delete(productId);
    } else {
        newFavs.add(productId);
    }
    setFavorites(newFavs);
  };

  const handleBatchUpdate = (result: BatchResult) => {
      setBatchResults(prev => ({
          ...prev,
          [result.productId]: result
      }));
  };

  // Determine current active API Key
  const activeApiKey = role === 'admin' ? getEnvApiKey() : apiKey;

  if (!role) return (
      <LoginScreen 
        onLogin={setRole} 
        currentAvatar={userAvatar}
        onAvatarChange={handleAvatarChange}
      />
  );

  const favoriteProducts = products.filter(p => favorites.has(p.id));

  return (
    <div className="flex min-h-screen font-sans bg-[#F9FAFC] text-[#11142D]">
      {/* Sidebar - Analys Style */}
      <aside className="w-[300px] bg-white border-r border-[#E4E4E4] fixed h-full z-20 hidden md:flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.02)]">
        
        {/* HEADER: Avatar Locked (No Input) + Title Change */}
        <div className="px-8 py-10 flex items-center gap-5">
            {/* INCREASED SIZE */}
            <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-[3px] border-[#6C5DD3] shadow-xl shadow-indigo-200 shrink-0">
                <img src={userAvatar} className="w-full h-full object-cover" alt="Boss" />
            </div>
            {/* INCREASED SIZE & SPACING */}
            <h1 className="text-[26px] font-black text-[#11142D] tracking-tight leading-8">
                电商<br/>数据分析
            </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-12 custom-scrollbar">
            
            {/* APPLICATION */}
            <div>
                <h3 className="text-xs font-bold text-[#808191] uppercase tracking-[0.15em] mb-6 pl-4">应用 (Application)</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-5 px-5 py-4.5 rounded-[20px] bg-[#6C5DD3] text-white cursor-pointer shadow-lg shadow-indigo-200 transition-transform hover:scale-[1.02]">
                        <Home size={26} strokeWidth={2.5} />
                        <span className="font-bold text-base">多平台电商分析</span>
                    </div>
                    {/* RESTORED FILE UPLOAD BUTTON */}
                    <label className="flex items-center gap-5 px-5 py-4.5 rounded-[20px] bg-white border border-[#E4E4E4] text-[#11142D] cursor-pointer shadow-sm hover:shadow-md hover:border-[#6C5DD3] transition-all group">
                        <UploadCloud size={26} className="text-[#6C5DD3] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="font-bold text-base">导入数据 (Upload)</span>
                        <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>

                    {/* Batch AI Trigger */}
                    {favorites.size > 0 && (
                         <div 
                            onClick={() => setShowBatchModal(true)}
                            className="flex items-center gap-5 px-5 py-4.5 rounded-[20px] bg-[#FF754C] text-white cursor-pointer shadow-lg shadow-orange-200 transition-transform hover:scale-[1.02] animate-fade-in"
                        >
                            <Layers size={26} strokeWidth={2.5} />
                            <span className="font-bold text-base">AI 批量生成 ({favorites.size})</span>
                        </div>
                    )}
                </div>
            </div>

            {/* EXTERNAL TOOLS SECTION - DATA TOOLS (RESTORED) */}
            <div>
                <h3 className="text-xs font-bold text-[#808191] uppercase tracking-[0.15em] mb-6 pl-4">数据工具 (Data Tools)</h3>
                <div className="space-y-7">
                    
                    {/* Global Cross-border */}
                    <div className="bg-[#F9FAFC] rounded-3xl p-1.5 border border-[#F0F0F0]">
                        <div className="flex items-center gap-2.5 px-4 py-3 mb-1">
                            <Globe size={18} className="text-[#6C5DD3]" />
                            <span className="text-[11px] font-extrabold text-[#808191] uppercase tracking-wide">国外跨境 (Global)</span>
                        </div>
                        <div className="space-y-1.5">
                            <a href="https://trends.google.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><TrendingUp size={18} /></div>
                                    <span className="text-sm font-bold text-[#11142D]">Google Trends</span>
                                </div>
                                <ExternalLink size={16} className="text-[#808191] opacity-0 group-hover:opacity-100" />
                            </a>
                            <a href="https://www.kalodata.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Video size={18} /></div>
                                    <span className="text-sm font-bold text-[#11142D]">Kalodata</span>
                                </div>
                                <ExternalLink size={16} className="text-[#808191] opacity-0 group-hover:opacity-100" />
                            </a>
                            <a href="https://keepa.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center"><ShoppingCart size={18} /></div>
                                    <span className="text-sm font-bold text-[#11142D]">Keepa</span>
                                </div>
                                <ExternalLink size={16} className="text-[#808191] opacity-0 group-hover:opacity-100" />
                            </a>
                        </div>
                    </div>

                    {/* Domestic China */}
                    <div className="bg-[#F9FAFC] rounded-3xl p-1.5 border border-[#F0F0F0]">
                        <div className="flex items-center gap-2.5 px-4 py-3 mb-1">
                            <ShoppingBag size={18} className="text-[#FF754C]" />
                            <span className="text-[11px] font-extrabold text-[#808191] uppercase tracking-wide">国内电商 (China)</span>
                        </div>
                        <div className="space-y-1.5">
                            <a href="https://sycm.taobao.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"><BarChart2 size={18} /></div>
                                    <span className="text-sm font-bold text-[#11142D]">生意参谋</span>
                                </div>
                                <ExternalLink size={16} className="text-[#808191] opacity-0 group-hover:opacity-100" />
                            </a>
                            <a href="https://www.chanmama.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Activity size={18} /></div>
                                    <span className="text-sm font-bold text-[#11142D]">蝉妈妈</span>
                                </div>
                                <ExternalLink size={16} className="text-[#808191] opacity-0 group-hover:opacity-100" />
                            </a>
                            <a href="https://www.ddqbt.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Zap size={18} /></div>
                                    <span className="text-sm font-bold text-[#11142D]">多多情报通</span>
                                </div>
                                <ExternalLink size={16} className="text-[#808191] opacity-0 group-hover:opacity-100" />
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* SYSTEM */}
            <div>
                 <h3 className="text-xs font-bold text-[#808191] uppercase tracking-[0.15em] mb-6 pl-4">系统 (System)</h3>
                 <div className="px-2">
                     {role === 'admin' ? (
                         <div className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-[#E2FBD7] text-[#2F9042] border border-[#2F9042]/20 shadow-sm">
                            <Zap size={22} fill="currentColor" />
                            <span className="font-bold text-sm">企业版已激活</span>
                         </div>
                     ) : (
                         <div className="relative">
                             <input 
                                type="password"
                                placeholder="Gemini API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full pl-4 pr-10 py-4 bg-[#F9FAFC] border border-[#E4E4E4] rounded-2xl text-sm text-[#11142D] focus:border-[#6C5DD3] outline-none transition-all placeholder:text-[#B2B3BD]"
                             />
                             {/* GREEN STATUS INDICATOR */}
                             {apiKey.length > 5 && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none animate-scale-in">
                                    <CheckCircle2 size={20} fill="#2F9042" className="text-white" />
                                </div>
                             )}
                         </div>
                     )}
                 </div>
            </div>
        </div>
        
        <div className="p-8 border-t border-[#E4E4E4]">
            <button onClick={() => setRole(null)} className="w-full flex items-center gap-4 px-5 py-4 text-[#808191] hover:text-[#FF754C] hover:bg-[#FFF0E6] rounded-2xl transition-all font-bold text-sm">
                <LogOut size={22} /> 退出登录
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[300px] p-6 md:p-10 overflow-y-auto">
        {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-[30px] shadow-sm border border-[#E4E4E4] m-4 p-10 text-center">
                <div className="bg-[#F0EFFB] p-8 rounded-full mb-6 animate-bounce">
                    <UploadCloud size={64} className="text-[#6C5DD3]" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#11142D] mb-2">开始您的选品分析</h3>
                <p className="text-[#808191] max-w-md mx-auto">请从左侧栏上传 CSV 或 Excel 格式的商品数据以生成智能分析与AI内容。</p>
            </div>
        ) : (
            <Dashboard 
                products={filteredProducts} 
                maxGmv={maxGmv} 
                onSelectProduct={handleProductSelect}
                userRole={role}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onOpenBatchAI={() => setShowBatchModal(true)}
                userAvatar={userAvatar}
                apiKey={activeApiKey} // Pass the API Key
            />
        )}
      </main>

      {/* Product Analysis Modal */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-300 ${isAnalysisVisible ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'}`}
      >
        {selectedProduct && (
          <AnalysisRoom 
              product={selectedProduct} 
              maxGmv={maxGmv}
              maxSales={maxSales}
              onClose={handleAnalysisClose}
              apiKey={activeApiKey} 
          />
        )}
      </div>

      {/* Batch AI Modal */}
      {showBatchModal && (
          <BatchAnalysisModal 
            products={favoriteProducts}
            savedResults={batchResults} // Pass persisted results
            onUpdateResult={handleBatchUpdate} // Callback to save results
            onClose={() => setShowBatchModal(false)}
            apiKey={activeApiKey}
          />
      )}

      {/* Mapping Modal */}
      {showMapping && rawHeaders.length > 0 && (
          <div className="fixed inset-0 bg-[#11142D]/40 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-[30px] shadow-2xl p-8 w-full max-w-lg animate-scale-in">
                  <h3 className="text-xl font-bold text-[#11142D] mb-8 flex items-center gap-3">
                      <div className="bg-[#F0EFFB] p-3 rounded-2xl text-[#6C5DD3]">
                        <Sliders size={24} />
                      </div>
                      数据列映射
                  </h3>
                  <div className="space-y-5">
                      <div>
                          <label className="block text-xs font-bold text-[#808191] uppercase tracking-wider mb-2">商品标题 (Title)</label>
                          <select className="w-full p-3 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl text-[#11142D] outline-none focus:border-[#6C5DD3] transition-colors" value={mapping.title} onChange={(e) => setMapping(p => ({...p, title: e.target.value}))}>
                              {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#808191] uppercase tracking-wider mb-2">价格 (Price)</label>
                            <select className="w-full p-3 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl text-[#11142D] outline-none focus:border-[#6C5DD3] transition-colors" value={mapping.price} onChange={(e) => setMapping(p => ({...p, price: e.target.value}))}>
                                {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#808191] uppercase tracking-wider mb-2">销量 (Sales)</label>
                            <select className="w-full p-3 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl text-[#11142D] outline-none focus:border-[#6C5DD3] transition-colors" value={mapping.sales} onChange={(e) => setMapping(p => ({...p, sales: e.target.value}))}>
                                {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-[#808191] uppercase tracking-wider mb-2">图片链接 (选填)</label>
                          <select className="w-full p-3 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl text-[#11142D] outline-none focus:border-[#6C5DD3] transition-colors" value={mapping.image} onChange={(e) => setMapping(p => ({...p, image: e.target.value}))}>
                              <option value="">-- 无 --</option>
                              {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                      </div>
                  </div>
                  <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-[#E4E4E4]">
                      <button onClick={() => setShowMapping(false)} className="px-6 py-3 text-[#808191] hover:text-[#11142D] font-bold transition-colors">取消</button>
                      <button onClick={confirmMapping} className="px-6 py-3 bg-[#6C5DD3] text-white rounded-xl hover:bg-[#5a4cb5] font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5">确认映射</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}