/**
 * app/api/stock/search/route.ts
 * ==============================
 * 💡 이 API는 종목명(한글 포함)을 받아서 야후 파이낸스 장부 번호(티커)로 바꿔주는
 *    '외국인 가이드' 역할을 해요.
 *
 *    야후 파이낸스는 한글 검색을 지원하지 않아요.
 *    그래서 한글이 포함된 검색어는 내장 한국 종목 테이블에서 먼저 찾고,
 *    영문 검색어는 야후 API를 직접 호출해요.
 *
 * 호출 예시:
 *   GET /api/stock/search?q=삼성전자   ← 한글 → 로컬 테이블
 *   GET /api/stock/search?q=apple      ← 영문 → 야후 API
 *   GET /api/stock/search?q=AAPL       ← 티커 → 야후 API
 */

import { NextRequest, NextResponse } from "next/server"
import YahooFinanceClass from "yahoo-finance2"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinanceClass as any)()

// =============================================================================
// 📚 한국 종목 로컬 매핑 테이블
// 💡 야후 파이낸스가 한글을 읽지 못하기 때문에, 자주 찾는 한국 종목들을
//    이 '내장 사전'에 미리 정리해뒀어요.
//    사용자가 한글로 검색하면 야후 대신 이 사전을 먼저 열어봐요!
// =============================================================================
interface KrStock {
  ticker: string   // 야후 파이낸스 형식 (예: "005930.KS")
  name:   string   // 한국어 종목명
  market: string   // "코스피" | "코스닥"
}

const KR_STOCKS: KrStock[] = [
  // ── 코스피 대형주 ──────────────────────────────────────────────────────────
  { ticker: "005930.KS", name: "삼성전자",      market: "코스피" },
  { ticker: "000660.KS", name: "SK하이닉스",    market: "코스피" },
  { ticker: "005380.KS", name: "현대차",         market: "코스피" },
  { ticker: "035420.KS", name: "NAVER",          market: "코스피" },
  { ticker: "051910.KS", name: "LG화학",         market: "코스피" },
  { ticker: "006400.KS", name: "삼성SDI",        market: "코스피" },
  { ticker: "035720.KS", name: "카카오",         market: "코스피" },
  { ticker: "207940.KS", name: "삼성바이오로직스", market: "코스피" },
  { ticker: "005490.KS", name: "POSCO홀딩스",    market: "코스피" },
  { ticker: "000270.KS", name: "기아",           market: "코스피" },
  { ticker: "068270.KS", name: "셀트리온",       market: "코스피" },
  { ticker: "105560.KS", name: "KB금융",         market: "코스피" },
  { ticker: "055550.KS", name: "신한지주",       market: "코스피" },
  { ticker: "086790.KS", name: "하나금융지주",   market: "코스피" },
  { ticker: "032830.KS", name: "삼성생명",       market: "코스피" },
  { ticker: "096770.KS", name: "SK이노베이션",   market: "코스피" },
  { ticker: "003550.KS", name: "LG",             market: "코스피" },
  { ticker: "011200.KS", name: "HMM",            market: "코스피" },
  { ticker: "012330.KS", name: "현대모비스",     market: "코스피" },
  { ticker: "018260.KS", name: "삼성에스디에스", market: "코스피" },
  { ticker: "015760.KS", name: "한국전력",       market: "코스피" },
  { ticker: "034730.KS", name: "SK",             market: "코스피" },
  { ticker: "017670.KS", name: "SK텔레콤",       market: "코스피" },
  { ticker: "030200.KS", name: "KT",             market: "코스피" },
  { ticker: "032640.KS", name: "LG유플러스",     market: "코스피" },
  { ticker: "066570.KS", name: "LG전자",         market: "코스피" },
  { ticker: "003670.KS", name: "포스코퓨처엠",   market: "코스피" },
  { ticker: "028260.KS", name: "삼성물산",       market: "코스피" },
  { ticker: "009150.KS", name: "삼성전기",       market: "코스피" },
  { ticker: "036570.KS", name: "엔씨소프트",     market: "코스피" },
  { ticker: "251270.KS", name: "넷마블",         market: "코스피" },
  { ticker: "009830.KS", name: "한화솔루션",     market: "코스피" },
  { ticker: "042660.KS", name: "한화오션",       market: "코스피" },
  { ticker: "010130.KS", name: "고려아연",       market: "코스피" },
  { ticker: "000100.KS", name: "유한양행",       market: "코스피" },
  { ticker: "326030.KS", name: "SK바이오팜",     market: "코스피" },
  { ticker: "011070.KS", name: "LG이노텍",       market: "코스피" },
  { ticker: "047050.KS", name: "포스코인터내셔널", market: "코스피" },
  { ticker: "139480.KS", name: "이마트",         market: "코스피" },
  { ticker: "069960.KS", name: "현대백화점",     market: "코스피" },
  // ── 코스닥 ────────────────────────────────────────────────────────────────
  { ticker: "247540.KQ", name: "에코프로비엠",   market: "코스닥" },
  { ticker: "086520.KQ", name: "에코프로",       market: "코스닥" },
  { ticker: "091990.KQ", name: "셀트리온헬스케어", market: "코스닥" },
  { ticker: "196170.KQ", name: "알테오젠",       market: "코스닥" },
  { ticker: "263750.KQ", name: "펄어비스",       market: "코스닥" },
  { ticker: "112040.KQ", name: "위메이드",       market: "코스닥" },
  { ticker: "036450.KQ", name: "한국가스공사",   market: "코스닥" },
  { ticker: "041510.KQ", name: "에스엠",         market: "코스닥" },
  { ticker: "035900.KQ", name: "JYP Ent.",       market: "코스닥" },
  { ticker: "122870.KQ", name: "와이지엔터테인먼트", market: "코스닥" },
  { ticker: "095340.KQ", name: "ISC",            market: "코스닥" },
  { ticker: "293490.KQ", name: "카카오게임즈",   market: "코스닥" },
  { ticker: "357780.KQ", name: "솔브레인",       market: "코스닥" },
]

// =============================================================================
// 🔍 한글 여부 판별
// 💡 유니코드 범위로 한글이 포함됐는지 확인해요.
// =============================================================================
function hasKorean(str: string): boolean {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(str)
}

// =============================================================================
// 거래소 코드 → 표시 이름
// =============================================================================
const EXCHANGE_LABEL: Record<string, string> = {
  KSC: "코스피",
  KOE: "코스닥",
  NMS: "나스닥",
  NYQ: "NYSE",
  NGM: "나스닥",
  PCX: "NYSE아카",
  ASE: "아멕스",
  TYO: "도쿄",
  HKG: "홍콩",
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  // ── 한글 검색: 로컬 테이블에서 찾기 ────────────────────────────────────────
  // 💡 야후가 한글을 모르기 때문에, 내장 사전을 펼쳐서 먼저 찾아봐요.
  //    종목명 앞부분이나 중간에 검색어가 포함되면 결과로 내보내요.
  if (hasKorean(query)) {
    const matched = KR_STOCKS
      .filter((s) => s.name.includes(query))
      .slice(0, 5)
      .map((s) => ({
        ticker:   s.ticker,
        name:     s.name,
        exchange: s.market,
        isKorean: true,
      }))

    return NextResponse.json({ results: matched })
  }

  // ── 숫자만 입력된 경우: 한국 종목코드로 간주 ─────────────────────────────
  // 💡 "032640" 처럼 숫자 6자리를 입력하면 .KS/.KQ 종목으로 간주하고 찾아줘요.
  if (/^\d{5,6}$/.test(query)) {
    const matched = KR_STOCKS
      .filter((s) => s.ticker.startsWith(query))
      .slice(0, 5)
      .map((s) => ({
        ticker:   s.ticker,
        name:     s.name,
        exchange: s.market,
        isKorean: true,
      }))

    if (matched.length > 0) {
      return NextResponse.json({ results: matched })
    }

    // 로컬에 없으면 .KS를 붙여서 야후에 직접 조회
    const withSuffix = `${query}.KS`
    return NextResponse.json({
      results: [{
        ticker:   withSuffix,
        name:     withSuffix,
        exchange: "코스피",
        isKorean: true,
      }],
    })
  }

  // ── 영문/티커 검색: 야후 파이낸스 API 호출 ──────────────────────────────
  // 💡 영문 검색어는 야후 파이낸스 가이드에게 직접 물어봐요.
  try {
    const searchResult = await yahooFinance.search(query, {
      newsCount:   0,
      quotesCount: 8,
    })

    const results = (searchResult.quotes ?? [])
      .filter((q: any) => q.quoteType === "EQUITY" && q.symbol)
      .slice(0, 5)
      .map((q: any) => {
        const symbol   = q.symbol
        const exchange = q.exchange ?? ""
        const isKorean = symbol.endsWith(".KS") || symbol.endsWith(".KQ")

        return {
          ticker:   symbol,
          name:     q.longname ?? q.shortname ?? symbol,
          exchange: EXCHANGE_LABEL[exchange] ?? exchange,
          isKorean,
        }
      })

    return NextResponse.json({ results })

  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류"
    console.error("[API /stock/search]", message)
    return NextResponse.json({ results: [], error: message }, { status: 500 })
  }
}
