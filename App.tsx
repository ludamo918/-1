import React, { useState, useEffect, useMemo } from 'react';
import LoginScreen from './components/LoginScreen'; 
import { Dashboard } from './components/Dashboard';
import { AnalysisRoom } from './components/AnalysisRoom';
import { BatchAnalysisModal } from './components/BatchAnalysisModal';
import { UserRole, Product, ColumnMapping, BatchResult } from './types';
import { cleanCurrency, parseCSV } from './utils/helpers';
import { UploadCloud, LogOut, Sliders, Home, Zap, Layers, CheckCircle2, Globe, ShoppingBag, ExternalLink, TrendingUp, Video, ShoppingCart, BarChart2, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';

// === 【配置区域】在这里修改密码 ===
const ADMIN_PASSWORD = "20261888";  // 👑 管理员密码（进去自带 Key）
const USER_PASSWORD  = "1027"; // 👥 通用用户密码（进去自己填 Key）
const SYSTEM_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ""; // 读取后台 Key

const DEMO_DATA: Product[] = [
    { id: '1', title: '星空投影灯 (Galaxy Projector)', price: 24.99, sales: 12500, gmv: 312375, imageUrl: 'https://picsum.photos/200/200?random=1', originalData: {} },
    { id: '2', title: '收腹塑身衣 (Shapewear)', price: 18.50, sales: 8900, gmv: 164650, imageUrl: 'https://picsum.photos/200/200?random=2', originalData: {} },
    { id: '3', title: '磁吸充电宝 (Magnetic Power Bank)', price: 12.99, sales: 5400, gmv: 70146, imageUrl: 'https://picsum.photos/200/200?random=3', originalData: {} },
    { id: '4', title: '便携热敏打印机 (Mini Printer)', price: 29.99, sales: 3200, gmv: 95968, imageUrl: 'https://picsum.photos/200/200?random=4', originalData: {} },
    { id: '5', title: '落日氛围灯 (Sunset Lamp)', price: 15.00, sales: 2100, gmv: 31500, imageUrl: 'https://picsum.photos/200/200?random=5', originalData: {} },
];

export const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=e5e7eb&glassesProbability=0";

export default function App() {
  // === 状态管理 ===
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [userRole, setUserRole] = useState<UserRole>('user');
  
  // 初始化检测
  useEffect(() => {
      const savedRole = localStorage.getItem('tk_pro_role');
      const savedKey = localStorage.getItem('tk_pro_key');
      
      if (savedRole) {
          setIsLoggedIn(true);
          setUserRole(savedRole as UserRole);
          // 如果是管理员，强制用系统的；如果是用户，用缓存的
          if (savedRole === 'admin' && SYSTEM_API_KEY) {
              setApiKey(SYSTEM_API_KEY);
          } else if (savedKey) {
              setApiKey(savedKey);
          }
      }
  }, []);

  const [products, setProducts] = useState<Product[]>(DEMO_DATA);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ title: '', price: '', sales: '', image: '' });
  const [showMapping, setShowMapping] = useState(false);
  
  const [userAvatar, setUserAvatar] = useState<string>(() => {
      return localStorage.getItem('tk_pro_avatar') || DEFAULT_AVATAR;
  });
  
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchResults, setBatchResults] = useState<Record<string, BatchResult>>({});
  
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [minSales, setMinSales] = useState(100);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);

  // === 【核心逻辑：双密码登录】 ===
  const handleLogin = (input: string) => {
      const trimmedInput = input.trim();

      // 1. 管理员通道
      if (trimmedInput === ADMIN_PASSWORD) {
          if (!SYSTEM_API_KEY) {
              alert("⚠️ 管理员提示：后台未配置 Key，将以空 Key 进入。");
          }
          enterSystem(SYSTEM_API_KEY, 'admin');
          // alert("管理员登录成功！"); 
      } 
      // 2. 通用用户通道
      else if (trimmedInput === USER_PASSWORD) {
          // 尝试读取用户以前存的 Key，如果没有就是空的
          const cachedUserKey = localStorage.getItem('tk_pro_key') || "";
          enterSystem(cachedUserKey, 'user');
      }
      // 3. 兼容直接输 Key 的情况 (可选)
      else if (trimmedInput.startsWith("AIza")) {
          enterSystem(trimmedInput, 'user');
      } 
      else {
          alert("密码错误！请输入管理员密码或通用访问密码。");
      }
  };

  const enterSystem = (key: string, role: string) => {
      setApiKey(key);
      setUserRole(role as UserRole);
      setIsLoggedIn(true); 
      
      localStorage.setItem('tk_pro_role', role);
      if (key) localStorage.setItem('tk_pro_key', key);
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setApiKey('');
      setUserRole('user');
      localStorage.removeItem('tk_pro_key');
      localStorage.removeItem('tk_pro_role');
  };

  // === 视图渲染 ===
  if (!isLoggedIn) {
      return (
          <LoginScreen 
            onLogin={handleLogin} 
            currentAvatar={userAvatar}
            onAvatarChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const res = reader.result as string;
                        setUserAvatar(res);
                        localStorage.setItem('tk_pro_avatar', res);
                    };
                    reader.readAsDataURL(file);
                }
            }}
          />
      );
  }

  // 业务逻辑函数 (保持不变)
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

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsAnalysisVisible(true);
  };

  const toggleFavorite = (productId: string) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(productId)) { newFavs.delete(productId); } else { newFavs.add(productId); }
    setFavorites(newFavs);
  };

  const favoriteProducts = products.filter(p => favorites.has(p.id));

  return (
    <div className="flex min-h-screen font-sans bg-[#F9FAFC] text-[#11142D]">
      {/* Sidebar */}
      <aside className="w-[300px] bg-white border-r border-[#E4E4E4] fixed h-full z-20 hidden md:flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.02)]">
        <div className="px-8 py-10 flex items-center gap-5">
            <div className={`w-[72px] h-[72px] rounded-full overflow-hidden border-[3px] shadow-xl shrink-0 ${userRole === 'admin' ? 'border-[#2F9042] shadow-green-200' : 'border-[#6C5DD3] shadow-indigo-200'}`}>
                <img src={userAvatar} className="w-full h-full object-cover" alt="User" />
            </div>
            <h1 className="text-[26px] font-black text-[#11142D] tracking-tight leading-8">
                电商<br/>数据分析
            </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-12 custom-scrollbar">
            <div>
                <h3 className="text-xs font-bold text-[#808191] uppercase tracking-[0.15em] mb-6 pl-4">应用 (Application)</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-5 px-5 py-4.5 rounded-[20px] bg-[#6C5DD3] text-white cursor-pointer shadow-lg shadow-indigo-200 transition-transform hover:scale-[1.02]">
                        <Home size={26} strokeWidth={2.5} />
                        <span className="font-bold text-base">多平台电商分析</span>
                    </div>
                    <label className="flex items-center gap-5 px-5 py-4.5 rounded-[20px] bg-white border border-[#E4E4E4] text-[#11142D] cursor-pointer shadow-sm hover:shadow-md hover:border-[#6C5DD3] transition-all group">
                        <UploadCloud size={26} className="text-[#6C5DD3] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="font-bold text-base">导入数据 (Upload)</span>
                        <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                    {favorites.size > 0 && (
                         <div onClick={() => setShowBatchModal(true)} className="flex items-center gap-5 px-5 py-4.5 rounded-[20px] bg-[#FF754C] text-white cursor-pointer shadow-lg shadow-orange-200 transition-transform hover:scale-[1.02] animate-fade-in">
                            <Layers size={26} strokeWidth={2.5} />
                            <span className="font-bold text-base">AI 批量生成 ({favorites.size})</span>
                        </div>
                    )}
                </div>
            </div>

            <div>
                 <h3 className="text-xs font-bold text-[#808191] uppercase tracking-[0.15em] mb-6 pl-4">系统 (System)</h3>
                 <div className="px-2">
                     {/* 区别显示逻辑 */}
                     {userRole === 'admin' ? (
                        <div className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-[#E2FBD7] text-[#2F9042] border border-[#2F9042]/20 shadow-sm animate-fade-in">
                            <Zap size={22} fill="currentColor" />
                            <span className="font-bold text-sm">管理员 (Admin Mode)</span>
                        </div>
                     ) : (
                         <div className="relative animate-fade-in">
                             {/* 普通用户在这里填 Key */}
                             <input 
                                type="password" 
                                placeholder="请输入您的 API Key" 
                                value={apiKey} 
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    localStorage.setItem('tk_pro_key', e.target.value);
                                }}
                                className="w-full pl-4 pr-10 py-4 bg-[#F9FAFC] border border-[#E4E4E4] rounded-2xl text-sm text-[#11142D] focus:border-[#6C5DD3] outline-none transition-all placeholder:text-[#B2B3BD]"
                             />
                             {apiKey.length > 10 && (
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
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 text-[#808191] hover:text-[#FF754C] hover:bg-[#FFF0E6] rounded-2xl transition-all font-bold text-sm">
                <LogOut size={22} /> 退出登录
            </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-[300px] p-6 md:p-10 overflow-y-auto">
        {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-[30px] shadow-sm border border-[#E4E4E4] m-4 p-10 text-center">
                <div className="bg-[#F0EFFB] p-8 rounded-full mb-6 animate-bounce"><UploadCloud size={64} className="text-[#6C5DD3]" /></div>
                <h3 className="text-2xl font-extrabold text-[#11142D] mb-2">开始您的选品分析</h3>
                <p className="text-[#808191] max-w-md mx-auto">请从左侧栏上传 CSV 或 Excel 格式的商品数据。</p>
            </div>
        ) : (
            <Dashboard 
                products={filteredProducts} 
                maxGmv={maxGmv} 
                onSelectProduct={handleProductSelect}
                userRole={userRole} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onOpenBatchAI={() => setShowBatchModal(true)}
                userAvatar={userAvatar}
                apiKey={apiKey} 
            />
        )}
      </main>

      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isAnalysisVisible ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'}`}>
        {selectedProduct && <AnalysisRoom product={selectedProduct} maxGmv={maxGmv} maxSales={maxSales} onClose={() => setIsAnalysisVisible(false)} apiKey={apiKey} />}
      </div>

      {showBatchModal && <BatchAnalysisModal products={favoriteProducts} savedResults={batchResults} onUpdateResult={(r) => setBatchResults(p => ({...p, [r.productId]: r}))} onClose={() => setShowBatchModal(false)} apiKey={apiKey} />}

      {showMapping && rawHeaders.length > 0 && (
          <div className="fixed inset-0 bg-[#11142D]/40 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-[30px] shadow-2xl p-8 w-full max-w-lg animate-scale-in">
                  <h3 className="text-xl font-bold text-[#11142D] mb-8 flex items-center gap-3">
                      <div className="bg-[#F0EFFB] p-3 rounded-2xl text-[#6C5DD3]"><Sliders size={24} /></div>数据列映射
                  </h3>
                  <div className="space-y-5">
                      <div><label className="block text-xs font-bold text-[#808191] uppercase tracking-wider mb-2">标题</label><select className="w-full p-3 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl" value={mapping.title} onChange={(e) => setMapping(p => ({...p, title: e.target.value}))}>{rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-[#808191] uppercase tracking-wider mb-2">价格</label><select className="w-full p-3 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl" value={mapping.price} onChange={(e) => setMapping(p => ({...p, price: e.target.value}))}>{rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-[#808191] uppercase tracking-wider mb-2">销量</label><select className="w-full p-3 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl" value={mapping.sales} onChange={(e) => setMapping(p => ({...p, sales: e.target.value}))}>{rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                      </div>
                      <div><label className="block text-xs font-bold text-[#808191] uppercase tracking-wider mb-2">图片 (选填)</label><select className="w-full p-3 bg-[#F9FAFC] border border-[#E4E4E4] rounded-xl" value={mapping.image} onChange={(e) => setMapping(p => ({...p, image: e.target.value}))}><option value="">-- 无 --</option>{rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                  </div>
                  <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-[#E4E4E4]">
                      <button onClick={() => setShowMapping(false)} className="px-6 py-3 text-[#808191] font-bold">取消</button>
                      <button onClick={confirmMapping} className="px-6 py-3 bg-[#6C5DD3] text-white rounded-xl font-bold shadow-lg">确认映射</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
