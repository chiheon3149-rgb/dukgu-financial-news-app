import { NextResponse } from "next/server"

// =============================================================================
// 📡 /api/market/bonds-kr — ECOS (한국은행) 국고채 수익률
// 통계표: 817Y002 / 주기: D (일별)
// =============================================================================

const BOK_KEY   = process.env.BOK_API_KEY ?? ""
const STAT_CODE = "817Y002"

const KR_BONDS = [
  { itemCode: "010190000", name: "한국 국채 1년" },
  { itemCode: "010195000", name: "한국 국채 2년" },
  { itemCode: "010200000", name: "한국 국채 3년" },
  { itemCode: "010200001", name: "한국 국채 5년" },
  { itemCode: "010210000", name: "한국 국채 10년" },
  { itemCode: "010220000", name: "한국 국채 20년" },
  { itemCode: "010230000", name: "한국 국채 30년" },
]

function dateStr(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10).replace(/-/g, "")
}

async function fetchEcos(itemCode: string): Promise<{ price: number; prev: number } | null> {
  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${BOK_KEY}/json/kr/1/5/${STAT_CODE}/D/${dateStr(30)}/${dateStr(0)}/${itemCode}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null

  const json = await res.json()
  if (json?.RESULT) return null

  const rows: Array<{ TIME: string; DATA_VALUE: string }> = json?.StatisticSearch?.row ?? []
  if (rows.length === 0) return null

  const sorted = [...rows].sort((a, b) => a.TIME.localeCompare(b.TIME))
  const price = parseFloat(sorted[sorted.length - 1].DATA_VALUE)
  const prev  = sorted.length >= 2 ? parseFloat(sorted[sorted.length - 2].DATA_VALUE) : price

  if (!price || isNaN(price)) return null
  return { price, prev }
}

const FALLBACK = KR_BONDS.map((b) => ({ name: b.name, currentPrice: null, change: 0, changePercent: 0 }))

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const isDebug = searchParams.get("debug") === "1"

  if (!BOK_KEY) {
    return NextResponse.json({ bonds: FALLBACK, source: "fallback", error: "BOK_API_KEY 없음", fetchedAt: new Date().toISOString() })
  }

  try {
    const results = await Promise.all(
      KR_BONDS.map(async (bond) => {
        const data = await fetchEcos(bond.itemCode)
        if (!data) return { name: bond.name, currentPrice: null, change: 0, changePercent: 0 }

        const change = parseFloat((data.price - data.prev).toFixed(4))
        const changePercent = data.prev > 0 ? parseFloat(((change / data.prev) * 100).toFixed(4)) : 0
        return { name: bond.name, currentPrice: data.price, change, changePercent }
      })
    )

    if (isDebug) {
      return NextResponse.json({ bonds: results, source: "ecos", fetchedAt: new Date().toISOString() })
    }

    const validCount = results.filter((r) => r.currentPrice !== null).length
    if (validCount === 0) {
      return NextResponse.json({ bonds: FALLBACK, source: "fallback", fetchedAt: new Date().toISOString() })
    }

    return NextResponse.json({ bonds: results, source: "ecos", fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error("[bonds-kr] 실패:", err)
    return NextResponse.json({ bonds: FALLBACK, source: "fallback", fetchedAt: new Date().toISOString() })
  }
}
