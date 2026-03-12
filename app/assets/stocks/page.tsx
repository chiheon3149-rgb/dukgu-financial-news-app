"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Plus, Trash2, Briefcase, ChevronRight, Loader2, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { useStockPortfolio } from "@/hooks/use-stock-portfolio"
import { useStockPortfolioContext } from "@/context/stock-portfolio-context"

// DB 테이블 구조에 맞춘 타입
export interface StockAccount {
  id: string
  name: string
  created_at: string
}

export default function StocksAccountPage() {
  const { profile } = useUser()
  const [accounts, setAccounts] = useState<StockAccount[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [accountName, setAccountName] = useState("")
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // 💡 전체 주식 데이터를 합산하기 위해 훅 호출 (accountId를 안 넘기면 전체를 가져옵니다!)
  const usdToKrw = useExchangeRate()
  const { rows, isLoadingPrices } = useStockPortfolio(usdToKrw)
  const { removeHoldingsByAccount } = useStockPortfolioContext()

  // 💡 전체 계좌의 총 자산 및 투자원금 계산
  const { totalValueKrw, totalInvestedKrw } = useMemo(() => {
    let val = 0
    let inv = 0
    rows.forEach((row) => {
      const rate = row.holding.currency === "USD" ? usdToKrw : 1
      val += row.currentValue * rate
      inv += row.stats.totalInvested * rate
    })
    return { totalValueKrw: val, totalInvestedKrw: inv }
  }, [rows, usdToKrw])

  const totalPnl = totalValueKrw - totalInvestedKrw
  const totalReturnRate = totalInvestedKrw > 0 ? (totalPnl / totalInvestedKrw) * 100 : 0
  const isUp = totalReturnRate > 0
  const isDown = totalReturnRate < 0

  // 1️⃣ DB에서 내 계좌 목록 불러오기
  useEffect(() => {
    if (!profile?.id) return
    const fetchAccounts = async () => {
      setIsLoadingAccounts(true)
      try {
        const { data, error } = await supabase
          .from("asset_stock_accounts")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: true })

        if (error) throw error
        if (data) setAccounts(data)
      } catch (error) {
        toast.error("계좌 정보를 불러오지 못했습니다.")
      } finally {
        setIsLoadingAccounts(false)
      }
    }
    fetchAccounts()
  }, [profile?.id])

  // 2️⃣ DB에 새 계좌 만들기
  const handleAddAccount = async () => {
    if (!accountName.trim() || !profile?.id) {
      toast.error("계좌 이름을 입력해주세요.")
      return
    }
    
    try {
      const { data, error } = await supabase
        .from("asset_stock_accounts")
        .insert({
          user_id: profile.id,
          name: accountName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setAccounts([...accounts, data])
      setAccountName("")
      setIsFormOpen(false)
      toast.success(`'${data.name}' 계좌가 생성되었습니다!`)
    } catch (error) {
      toast.error("계좌 생성 중 오류가 발생했습니다.")
    }
  }

  // 3️⃣ DB에서 계좌 이름 수정
  const handleRenameAccount = async (id: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) { toast.error("계좌 이름을 입력해주세요."); return }
    try {
      const { error } = await supabase
        .from("asset_stock_accounts")
        .update({ name: trimmed })
        .eq("id", id)
      if (error) throw error
      setAccounts(accounts.map((a) => a.id === id ? { ...a, name: trimmed } : a))
      setEditingAccountId(null)
      toast.success("계좌 이름이 변경되었습니다.")
    } catch {
      toast.error("이름 변경에 실패했습니다.")
    }
  }

  // 4️⃣ DB에서 계좌 삭제하기
  const handleRemoveAccount = (id: string, name: string) => {
    toast(`'${name}' 계좌를 삭제하시겠습니까?`, {
      description: "계좌 안의 모든 종목 기록도 함께 삭제됩니다.",
      action: {
        label: "삭제",
        onClick: async () => {
          try {
            const { error } = await supabase
              .from("asset_stock_accounts")
              .delete()
              .eq("id", id)

            if (error) throw error

            setAccounts(accounts.filter((a) => a.id !== id))
            removeHoldingsByAccount(id)
            toast.success("계좌가 삭제되었습니다.")
          } catch (error) {
            toast.error("삭제에 실패했습니다.")
          }
        },
      },
      cancel: { label: "취소", onClick: () => {} },
    })
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-20">
      <DetailHeader
        showBack
        title={
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">주식 포트폴리오</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        
        {/* 🚀 상단 요약 (전체 계좌 총합 데이터 연동 완료!) */}
        <section className="bg-white rounded-[28px] shadow-[0_2px_10px_rgba(0,0,0,0.07)] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">주식 총 평가금액 (원화 환산)</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-black text-slate-900 tracking-tighter truncate pr-2">
                {Math.round(totalValueKrw).toLocaleString("ko-KR")}원
              </p>
              <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-black shrink-0 ${isUp ? "bg-rose-50 text-rose-500" : isDown ? "bg-blue-50 text-blue-500" : "bg-slate-50 text-slate-400"}`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                {isLoadingPrices ? <Loader2 className="w-3 h-3 animate-spin" /> : `${isUp ? "+" : ""}${totalReturnRate.toFixed(2)}%`}
              </div>
            </div>

            {/* 💡 세부 지표 3종 세트 추가 */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">운용 계좌</span>
                <span className="text-[13px] font-black text-slate-800">
                  {isLoadingAccounts ? "-" : accounts.length}개
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">총 투자원금</span>
                <span className="text-[13px] font-black text-slate-800 truncate">
                  {Math.round(totalInvestedKrw).toLocaleString()}원
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-slate-400">총 평가손익</span>
                <span className={`text-[13px] font-black truncate ${isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-700"}`}>
                  {isUp ? "+" : ""}{Math.round(totalPnl).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 계좌 목록 섹션 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              내 주식 계좌
            </h2>
            <button
              onClick={() => setIsFormOpen((v) => !v)}
              className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
            >
              <Plus className="w-3 h-3" /> 계좌 추가
            </button>
          </div>

          {/* 계좌 추가 폼 */}
          {isFormOpen && (
            <div className="bg-white rounded-[24px] border border-emerald-100 shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">계좌 별명</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="예: 키움증권(미국장), ISA계좌"
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-all"
                  autoFocus
                />
              </div>
              <button
                onClick={handleAddAccount}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[18px] text-[13px] font-black transition-all active:scale-[0.98]"
              >
                계좌 만들기
              </button>
            </div>
          )}

          {/* 계좌 리스트 */}
          {isLoadingAccounts ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="grid gap-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="space-y-0">
                  <div className="relative group">
                    <Link
                      href={`/assets/stocks/${acc.id}`}
                      className="flex items-center justify-between p-5 bg-white rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.07)] hover:shadow-md transition-all active:scale-[0.98] pr-24"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-black text-slate-800">{acc.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {new Date(acc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </Link>

                    {/* 수정 버튼 */}
                    <button
                      onClick={() => { setEditingAccountId(acc.id); setEditingName(acc.name) }}
                      className="absolute right-14 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 transition-all z-10"
                      aria-label={`${acc.name} 계좌 이름 수정`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleRemoveAccount(acc.id, acc.name)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all z-10"
                      aria-label={`${acc.name} 계좌 삭제`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 인라인 이름 수정 폼 */}
                  {editingAccountId === acc.id && (
                    <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.07)] px-5 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">새 계좌 별명</label>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRenameAccount(acc.id); if (e.key === "Escape") setEditingAccountId(null) }}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-all"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRenameAccount(acc.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[14px] text-[13px] font-black transition-all active:scale-[0.98]"
                        >
                          <Check className="w-3.5 h-3.5" /> 저장
                        </button>
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[14px] text-[13px] font-black transition-all active:scale-[0.98]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 계좌가 없을 때 */}
          {!isLoadingAccounts && accounts.length === 0 && !isFormOpen && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
              <Briefcase className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-bold text-slate-400">등록된 계좌가 없습니다</p>
              <p className="text-[11px] font-bold mt-1 text-slate-300">
                우측 상단의 '+ 계좌 추가'를 눌러 시작하세요.
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}