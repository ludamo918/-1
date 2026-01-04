import { Product, ScoreGrade, AnalysisScore } from '../types';

export const cleanCurrency = (val: any): number => {
  if (!val) return 0;
  let s = String(val).trim().toLowerCase().replace(/,/g, '');
  
  let multiplier = 1;
  if (s.includes('k')) {
    multiplier = 1000;
    s = s.replace('k', '');
  } else if (s.includes('w') || s.includes('万')) {
    multiplier = 10000;
    s = s.replace('w', '').replace('万', '');
  } else if (s.includes('m')) {
    multiplier = 1000000;
    s = s.replace('m', '');
  }

  const match = s.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]) * multiplier;
  }
  return 0;
};

// TikTok Shop Style Algorithm
export const calculateScore = (product: Product, maxGmv: number, maxSales: number): AnalysisScore => {
  // Edge case: empty data
  if (maxGmv === 0 || maxSales === 0) {
    return { grade: "C", text: "🌱 起步期", colorClass: "bg-slate-100 text-slate-500", label: "New" };
  }

  // 1. Normalize Metrics (0 to 1)
  const salesScore = product.sales / maxSales;
  const gmvScore = product.gmv / maxGmv;

  // 2. Weighted Composite Score
  // TikTok logic: Volume (Virality) is king (60%), Revenue is queen (40%)
  const compositeScore = (salesScore * 0.6) + (gmvScore * 0.4);

  // 3. Grading Logic
  if (compositeScore >= 0.8) {
    return { grade: "S+", text: "👑 头部爆款", colorClass: "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 border-orange-200", label: "Top Viral" };
  } else if (compositeScore >= 0.5) {
    // Check if it's purely high volume or high ticket
    if (salesScore > 0.7) {
        return { grade: "S", text: "🔥 流量爆款", colorClass: "bg-rose-50 text-rose-600 border-rose-100", label: "High Volume" };
    } else {
        return { grade: "S", text: "💰 高利爆款", colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100", label: "High Ticket" };
    }
  } else if (compositeScore >= 0.25) {
    return { grade: "A", text: "🚀 潜力股", colorClass: "bg-indigo-50 text-indigo-600 border-indigo-100", label: "Trending" };
  } else if (compositeScore >= 0.1) {
    return { grade: "B", text: "⚖️ 稳健款", colorClass: "bg-blue-50 text-blue-500 border-blue-100", label: "Stable" };
  } else {
    return { grade: "C", text: "💤 滞销/新品", colorClass: "bg-slate-50 text-slate-400 border-slate-100", label: "Low" };
  }
};

export const parseCSV = (content: string): Record<string, any>[] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const obj: Record<string, any> = {};
    // Basic CSV split handling
    const currentline = lines[i].split(','); 

    if (currentline.length === headers.length) {
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j]?.trim().replace(/^"|"$/g, '');
      }
      result.push(obj);
    }
  }
  return result;
};