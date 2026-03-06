"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Landmark, Plus, Trash2, Loader2, Home, Building2, MapPin, Pencil, X, CreditCard, Calculator, Activity, TrendingUp as TrendUpIcon, Search, RefreshCw, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useUser } from "@/context/user-context"
import { supabase } from "@/lib/supabase"
import type { RealEstateHolding } from "@/types"

const today = new Date().toISOString().split("T")[0]

const ASSET_TYPES = [
  { label: "아파트", value: "apartment" },
  { label: "오피스텔", value: "officetel" },
  { label: "빌라/연립", value: "villa" },
  { label: "상가/기타", value: "etc" },
]

const REPAYMENT_TYPES = [
  { label: "원리금균등", value: "level" },
  { label: "원금균등", value: "principal" },
  { label: "채증식", value: "graduated" },
]

// 📊 시세 추이 미니 그래프
function MiniPriceChart({ data }: { data: { price: number }[] }) {
  if (!data || data.length < 2) return <div className="h-full flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase tracking-tighter">No Data</div>
  const prices = data.map(d => d.price)
  const min = Math.min(...prices); const max = Math.max(...prices); const range = max - min || 1
  const points = prices.map((price, i) => ({ x: (i / (prices.length - 1)) * 100, y: 100 - ((price - min) / range) * 100 }))
  return (
    <svg viewBox="0 0 100 100" className="w-full h-10 overflow-visible" preserveAspectRatio="none">
      <path d={`M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function RealEstatePage() {
  const { profile } = useUser()
  const searchParams = useSearchParams()
  const viewUserId = searchParams.get("viewUserId")
  const isReadOnly = !!viewUserId
  const [holdings, setHoldings] = useState<RealEstateHolding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingPrice, setIsUpdatingPrice] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aptSearchResults, setAptSearchResults] = useState<any[]>([])
  const [isSearchingApt, setIsSearchingApt] = useState(false)

  const [form, setForm] = useState({
    name: "", address: "", asset_type: "apartment",
    acquisition_price: "", acquisition_date: today,
    current_estimated_price: "",
    loan_amount: "0", loan_repayment_type: "level", loan_interest_rate: "",
    loan_start_date: "", loan_end_date: "", loan_grace_period_months: "0",
    legal_dong_code: "", exclusive_area: "",
  })

  const fetchHoldings = async () => {
    const uid = viewUserId ?? profile?.id
    if (!uid) return
    setIsLoading(true)
    const { data } = await supabase.from('asset_realestate').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setHoldings(data || [])
    setIsLoading(false)
  }

  useEffect(() => { fetchHoldings() }, [profile?.id, viewUserId])

  const handleAddressSearch = () => {
    if (!(window as any).daum) {
      toast.error("주소 서비스 로딩 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        setForm(prev => ({ 
          ...prev, 
          address: data.address,
          legal_dong_code: data.sigunguCode 
        }))
        toast.success("주소와 지역코드가 입력되었습니다.");
      }
    }).open()
  }

  const searchApartmentsByRegion = async () => {
    if (!form.legal_dong_code) { toast.error("주소를 먼저 검색해 주세요."); return; }
    setIsSearchingApt(true);
    const loadId = toast.loading("최근 1년 치 장부를 뒤지는 중...");
    
    const now = new Date();
    let foundData: any[] = [];

    for (let i = 1; i <= 12; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dealYm = targetDate.getFullYear() + String(targetDate.getMonth() + 1).padStart(2, '0');
        
        try {
            const res = await fetch(`/api/real-estate/price?lawdCd=${form.legal_dong_code}&dealYm=${dealYm}`);
            const rawData = await res.json();

            if (rawData.error) {
              toast.error(`조회 실패: ${rawData.error}`, { id: loadId });
              setIsSearchingApt(false);
              return; 
            }

            const normalizedData = Array.isArray(rawData) ? rawData : (rawData && typeof rawData === 'object' && !rawData.error ? [rawData] : []);
            if (normalizedData.length > 0) { foundData = normalizedData; break; }
        } catch (e) { continue; }
    }

    if (foundData.length > 0) {
        // 💡 [기획 반영] 가나다순 정렬 로직 추가 (localeCompare 사용)
        const uniqueApts = Array.from(new Set(foundData.map((item: any) => `${item.aptNm || item.아파트}_${item.excluUseAr || item.전용면적}`)))
            .map(key => foundData.find((item: any) => `${item.aptNm || item.아파트}_${item.excluUseAr || item.전용면적}` === key))
            .sort((a: any, b: any) => {
                const nameA = a.aptNm || a.아파트 || "";
                const nameB = b.aptNm || b.아파트 || "";
                return nameA.localeCompare(nameB, 'ko');
            });
            
        setAptSearchResults(uniqueApts);
        toast.success("아파트 목록을 가나다순으로 정렬했습니다!", { id: loadId });
    } else {
        toast.error("최근 1년간 거래 내역이 없습니다. 시세를 직접 입력해주세요.", { id: loadId });
    }
    setIsSearchingApt(false);
  }

  const handleSelectApt = (apt: any) => {
    const aptName = apt.aptNm || apt.아파트 || "이름없음";
    const area = apt.excluUseAr || apt.전용면적 || "";
    const rawPrice = apt.dealAmount || apt.거래금액 || "0";
    
    const priceStr = String(rawPrice).replace(/,/g, '').trim();
    const parsedPrice = parseInt(priceStr) * 10000;

    setForm(prev => ({ 
      ...prev, 
      name: aptName, 
      exclusive_area: area.toString(),
      current_estimated_price: parsedPrice > 0 ? parsedPrice.toString() : prev.current_estimated_price
    }));
    setAptSearchResults([]);
    toast.success(`${aptName} 실거래가가 현재 시세에 자동 입력되었습니다.`);
  }

  const updateRealEstatePrice = async (h: RealEstateHolding) => {
    if (!h.legal_dong_code || !h.exclusive_area) {
      toast.error("지역코드와 전용면적 정보가 필요합니다.");
      return;
    }
    setIsUpdatingPrice(h.id);
    const loadId = toast.loading(`${h.name} 시세 동기화 중...`);
    
    const now = new Date();
    let latestPrice = 0;
    let newHistory: { date: string, price: number }[] = [];

    for (let i = 1; i <= 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dealYm = targetDate.getFullYear() + String(targetDate.getMonth() + 1).padStart(2, '0');
      try {
        const res = await fetch(`/api/real-estate/price?lawdCd=${h.legal_dong_code}&dealYm=${dealYm}`);
        const rawData = await res.json();
        const normalizedData = Array.isArray(rawData) ? rawData : (rawData && typeof rawData === 'object' && !rawData.error ? [rawData] : []);

        const matched = normalizedData.find((deal: any) => {
          const dealName = deal.aptNm || deal.아파트 || "";
          const dealArea = deal.excluUseAr || deal.전용면적 || 0;
          return dealName.includes(h.name.split(' ')[0]) && 
                 Math.abs(parseFloat(dealArea) - Number(h.exclusive_area)) < 0.5;
        });

        if (matched) {
          const rawPrice = matched.dealAmount || matched.거래금액 || "0";
          const price = parseInt(String(rawPrice).replace(/,/g, '').trim()) * 10000;
          newHistory.unshift({ date: `${dealYm.slice(4,6)}월`, price });
          if (latestPrice === 0) latestPrice = price; 
        }
      } catch (e) { continue; }
    }

    if (newHistory.length > 0) {
      const { error } = await supabase.from('asset_realestate').update({
        last_deal_price: latestPrice,
        current_estimated_price: latestPrice,
        price_history: newHistory,
        price_updated_at: new Date().toISOString()
      }).eq('id', h.id);
      
      if (!error) {
        toast.success(`${h.name} 업데이트 완료!`, { id: loadId });
        fetchHoldings();
      } else {
        toast.error("DB 업데이트 실패", { id: loadId });
      }
    } else {
      toast.info("1년 내 실거래 기록을 찾지 못했습니다.", { id: loadId });
    }
    setIsUpdatingPrice(null);
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("이름을 입력해 주세요."); return; }
    if (!profile?.id) return;

    setIsSubmitting(true);
    const payload = {
      user_id: profile.id,
      name: form.name.trim(),
      address: form.address.trim(),
      asset_type: form.asset_type,
      acquisition_price: Number(form.acquisition_price) || 0,
      acquisition_date: form.acquisition_date || today,
      current_estimated_price: Number(form.current_estimated_price) || Number(form.acquisition_price) || 0,
      loan_amount: Number(form.loan_amount) || 0,
      loan_repayment_type: form.loan_repayment_type,
      loan_interest_rate: form.loan_interest_rate ? Number(form.loan_interest_rate) : null,
      loan_start_date: form.loan_start_date === "" ? null : form.loan_start_date,
      loan_end_date: form.loan_end_date === "" ? null : form.loan_end_date,
      loan_grace_period_months: parseInt(form.loan_grace_period_months) || 0,
      legal_dong_code: form.legal_dong_code || "",
      exclusive_area: form.exclusive_area ? Number(form.exclusive_area) : null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = editingId 
        ? await supabase.from('asset_realestate').update(payload).eq('id', editingId) 
        : await supabase.from('asset_realestate').insert(payload);
      
      if (error) throw error;
      toast.success("성공적으로 저장되었습니다.");
      handleCloseForm();
      fetchHoldings();
    } catch (err: any) {
      console.error("❌ DB 에러 원인:", err);
      toast.error(`저장 실패: ${err.message || '데이터 입력을 확인해주세요.'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const calculateMonthlyPayment = (h: RealEstateHolding) => {
    const P = Number(h.loan_amount); const annualRate = Number(h.loan_interest_rate || 0) / 100; const r = annualRate / 12
    const graceMonths = Number(h.loan_grace_period_months || 0);
    if (P <= 0 || annualRate <= 0 || !h.loan_start_date) return 0;
    const startDate = new Date(h.loan_start_date); const now = new Date();
    const passedMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    if (passedMonths < graceMonths) return P * r;
    if (!h.loan_end_date) return P * r;
    const endDate = new Date(h.loan_end_date);
    const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    const repaymentMonths = totalMonths - graceMonths;
    if (repaymentMonths <= 0) return P * r;
    if (h.loan_repayment_type === 'level') return (P * r * Math.pow(1 + r, repaymentMonths)) / (Math.pow(1 + r, repaymentMonths) - 1);
    if (h.loan_repayment_type === 'principal') return (P / repaymentMonths) + (P * r);
    if (h.loan_repayment_type === 'graduated') return ((P * r * Math.pow(1 + r, repaymentMonths)) / (Math.pow(1 + r, repaymentMonths) - 1)) * 0.7;
    return 0;
  }

  const handleEditClick = (item: RealEstateHolding) => {
    setEditingId(item.id);
    setForm({
      name: item.name, address: item.address || "", asset_type: item.asset_type,
      acquisition_price: String(item.acquisition_price), acquisition_date: item.acquisition_date || today,
      current_estimated_price: String(item.current_estimated_price || ""),
      loan_amount: String(item.loan_amount), loan_repayment_type: item.loan_repayment_type || "level",
      loan_interest_rate: String(item.loan_interest_rate || ""),
      loan_start_date: item.loan_start_date || "", loan_end_date: item.loan_end_date || "",
      loan_grace_period_months: String(item.loan_grace_period_months || "0"),
      legal_dong_code: item.legal_dong_code || "", exclusive_area: String(item.exclusive_area || ""),
    });
    setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleCloseForm = () => {
    setIsFormOpen(false); setEditingId(null); setAptSearchResults([]);
    setForm({ 
        name: "", address: "", asset_type: "apartment", acquisition_price: "", acquisition_date: today, current_estimated_price: "",
        loan_amount: "0", loan_repayment_type: "level", loan_interest_rate: "", loan_start_date: "", loan_end_date: "", loan_grace_period_months: "0",
        legal_dong_code: "", exclusive_area: ""
    });
  }

  const fmt = (n: number) => `${Math.round(n / 10000).toLocaleString("ko-KR")}만원`

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader showBack title={<div className="flex items-center gap-2"><Landmark className="w-5 h-5 text-indigo-500" /><span className="text-lg font-black">부동산 자산 관리</span></div>} />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4">
          <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">내 부동산 순자산</p><p className="text-3xl font-black text-indigo-600 tracking-tighter">
            {fmt(holdings.reduce((acc, h) => acc + (Number(h.current_estimated_price || h.acquisition_price) - Number(h.loan_amount)), 0))}
          </p></div>
        </section>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2"><span className="w-1.5 h-4 bg-indigo-500 rounded-full" />보유 리스트</h3>
          {!isReadOnly && !isFormOpen && <button onClick={() => setIsFormOpen(true)} className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-all"><Plus className="w-3.5 h-3.5" /> 추가</button>}
        </div>

        {isFormOpen && (
          <div className="bg-white rounded-[28px] border border-indigo-100 shadow-xl p-5 space-y-6 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-black text-indigo-600">{editingId ? "자산 수정" : "새 자산 등록"}</h4>
              <button onClick={handleCloseForm} className="p-1.5 bg-slate-50 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {ASSET_TYPES.map(t => (<button key={t.value} onClick={() => setForm(f => ({ ...f, asset_type: t.value }))} className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${form.asset_type === t.value ? "bg-indigo-500 text-white border-indigo-500 shadow-md" : "bg-slate-50 text-slate-400 border-slate-100"}`}>{t.label}</button>))}
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1">주소 검색 및 지역코드</label>
                  <div className="flex gap-2">
                    <button onClick={handleAddressSearch} className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl text-[13px] font-bold text-left text-slate-500 border border-transparent focus:border-indigo-400">
                      {form.address || "클릭하여 주소 찾기"}
                    </button>
                    <div className="w-20 px-2 py-3 bg-slate-100 rounded-2xl text-[12px] font-black text-center text-indigo-600 flex items-center justify-center">
                        {form.legal_dong_code || "코드"}
                    </div>
                  </div>
                  {form.legal_dong_code && (
                    <button onClick={searchApartmentsByRegion} disabled={isSearchingApt} className="w-full mt-2 py-3 bg-slate-900 text-white rounded-2xl text-[12px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all">
                        {isSearchingApt ? <Loader2 className="w-4 h-4 animate-spin" /> : "해당 지역 실거래 목록 불러오기"}
                    </button>
                  )}
                </div>

                {aptSearchResults.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-2 max-h-48 overflow-y-auto border border-slate-100 shadow-inner">
                    {aptSearchResults.map((apt, idx) => (
                      <button key={idx} onClick={() => handleSelectApt(apt)} className="w-full text-left px-3 py-2 bg-white rounded-xl text-[12px] font-bold text-slate-700 flex items-center justify-between group active:bg-indigo-50 transition-colors">
                        <span>{apt.aptNm || apt.아파트} <span className="text-[10px] text-slate-400">({apt.excluUseAr || apt.전용면적}㎡)</span></span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-1">부동산 이름 *</label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:border-indigo-400" placeholder="직접 입력 가능" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 ml-1">전용면적 (㎡)</label><input type="number" value={form.exclusive_area} onChange={e => setForm(f => ({ ...f, exclusive_area: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[13px] font-bold outline-none" placeholder="84.9" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 ml-1">취득 가액 (원)</label><input type="number" value={form.acquisition_price} onChange={e => setForm(f => ({ ...f, acquisition_price: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[13px] font-bold outline-none" placeholder="0" /></div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-indigo-500 ml-1">현재 시세 (원) - 직접 수정 가능</label>
                <input type="number" value={form.current_estimated_price} onChange={e => setForm(f => ({ ...f, current_estimated_price: e.target.value }))} className="w-full px-4 py-3 bg-indigo-50/50 rounded-2xl text-[13px] font-black text-indigo-900 outline-none border border-indigo-100 focus:border-indigo-400" placeholder="조회 시 실거래가 자동 입력됨" />
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-[24px] space-y-4 border border-slate-100 shadow-inner">
              <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-indigo-500" /><span className="text-[12px] font-black text-slate-700">대출 및 상환 상세</span></div>
              <div className="grid grid-cols-3 gap-2">{REPAYMENT_TYPES.map(t => (<button key={t.value} onClick={() => setForm(f => ({ ...f, loan_repayment_type: t.value }))} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${form.loan_repayment_type === t.value ? "bg-indigo-400 text-white border-indigo-400 shadow-md" : "bg-white text-slate-400 border-slate-100"}`}>{t.label}</button>))}</div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.loan_amount} onChange={e => setForm(f => ({ ...f, loan_amount: e.target.value }))} className="w-full px-3 py-3 bg-white rounded-xl text-[12px] font-bold outline-none border border-slate-100" placeholder="대출 원금" />
                <input type="number" value={form.loan_interest_rate} onChange={e => setForm(f => ({ ...f, loan_interest_rate: e.target.value }))} className="w-full px-3 py-3 bg-white rounded-xl text-[12px] font-bold outline-none border border-slate-100" placeholder="금리 (%)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-1">대출 시작일</label><input type="date" value={form.loan_start_date} onChange={e => setForm(f => ({ ...f, loan_start_date: e.target.value }))} className="w-full px-3 py-2.5 bg-white rounded-xl text-[11px] font-bold outline-none" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-1">대출 만기일</label><input type="date" value={form.loan_end_date} onChange={e => setForm(f => ({ ...f, loan_end_date: e.target.value }))} className="w-full px-3 py-2.5 bg-white rounded-xl text-[11px] font-bold outline-none" /></div>
              </div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-1">거치 기간 (개월)</label><input type="number" value={form.loan_grace_period_months} onChange={e => setForm(f => ({ ...f, loan_grace_period_months: e.target.value }))} className="w-full px-3 py-2.5 bg-white rounded-xl text-[12px] font-bold outline-none" placeholder="0" /></div>
            </div>

            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-4 bg-indigo-500 text-white rounded-[22px] text-[14px] font-black shadow-lg active:scale-[0.98] transition-all">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "자산 저장 완료"}
            </button>
          </div>
        )}

        <div className="grid gap-4">
          {holdings.map(h => {
            const monthlyPayment = calculateMonthlyPayment(h); 
            const currentPrice = Number(h.current_estimated_price ?? h.acquisition_price);
            const acquisitionPrice = Number(h.acquisition_price);
            
            // 💡 [기획 반영] 수익률 계산 로직
            const roi = acquisitionPrice > 0 ? ((currentPrice - acquisitionPrice) / acquisitionPrice) * 100 : 0;
            const isPositive = roi > 0;
            const isNegative = roi < 0;

            return (
              <div key={h.id} className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-5 relative group overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">{h.asset_type === 'apartment' ? <Home className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}</div>
                    <div><h4 className="text-[16px] font-black text-slate-800 tracking-tight">{h.name} {h.exclusive_area ? `(${h.exclusive_area}㎡)` : ""}</h4></div>
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEditClick(h)} className="p-2.5 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { toast(`'${h.name}' 을(를) 삭제하시겠습니까?`, { description: "삭제된 데이터는 복구할 수 없습니다.", action: { label: "삭제", onClick: async () => { await supabase.from('asset_realestate').delete().eq('id', h.id); fetchHoldings(); } }, cancel: { label: "취소", onClick: () => {} } }) }} className="p-2.5 bg-slate-50 rounded-xl text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-indigo-500"><Activity className="w-3 h-3" /><span className="text-[10px] font-black uppercase tracking-tighter">최근 12개월 실거래 추이</span></div>
                        {!isReadOnly && (
                          <button onClick={() => updateRealEstatePrice(h)} disabled={isUpdatingPrice === h.id} className="p-1 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-500 active:rotate-180 transition-all">
                            {isUpdatingPrice === h.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black text-slate-900">{fmt(currentPrice)}</span>
                      {/* 💡 [기획 반영] 현재 시세 옆에 수익률 뱃지 달아주기 */}
                      {acquisitionPrice > 0 && currentPrice !== acquisitionPrice && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-rose-50 text-rose-500' : isNegative ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'}`}>
                          {isPositive ? '+' : ''}{roi.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-20 h-10 text-indigo-400"><MiniPriceChart data={h.price_history || []} /></div>
                </div>
                
                {monthlyPayment > 0 && (
                  <div className="bg-indigo-50/50 rounded-2xl p-4 flex items-center justify-between border border-indigo-100/50">
                    <div className="flex items-center gap-2 text-indigo-500"><Calculator className="w-3.5 h-3.5" /><span className="text-[11px] font-black">이번 달 상환액 {Number(h.loan_grace_period_months) > 0 ? "(거치중)" : ""}</span></div>
                    <span className="text-[14px] font-black text-slate-900">{fmt(monthlyPayment)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                  <div className="space-y-0.5"><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">보유 순자산</p><p className="text-[20px] font-black text-slate-900">{fmt(currentPrice - Number(h.loan_amount))}</p></div>
                  <div className="text-right space-y-0.5"><p className="text-[10px] font-black text-slate-400">대출 잔액</p><p className="text-[14px] font-black text-rose-500">{fmt(Number(h.loan_amount))}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  )
}