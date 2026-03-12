/**
 * app/api/stock/search/route.ts
 * ==============================
 * 💡 이 API는 종목명(한글 포함)을 받아서 야후 파이낸스 장부 번호(티커)로 바꿔주는
 *    '외국인 가이드' 역할을 해요.
 *
 *    사용자: "삼성전자 찾아줘"
 *    이 API: "야후야, 삼성전자가 뭔지 알아?"
 *    야후:   "응! 005930.KS야" ← 이 과정이 바로 이 API가 하는 일이에요!
 *
 * 호출 예시:
 *   GET /api/stock/search?q=삼성전자
 *   GET /api/stock/search?q=apple
 *   GET /api/stock/search?q=AAPL
 */

import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

// 거래소 코드 → 사람이 읽기 좋은 이름 매핑
// 💡 야후 파이낸스는 거래소를 영문 코드로 알려줘요.
//    이걸 사용자가 알아볼 수 있는 이름으로 번역해요.
const EXCHANGE_LABEL: Record<string, string> = {
  KSC:    "코스피",
  KOE:    "코스닥",
  NMS:    "나스닥",
  NYQ:    "NYSE",
  NGM:    "나스닥",
  PCX:    "NYSE아카",
  ASE:    "아멕스",
  TYO:    "도쿄",
  HKG:    "홍콩",
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  // 💡 검색어가 없거나 너무 짧으면 빈 배열 반환 (API 낭비 방지)
  if (query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  try {
    // ── 야후 파이낸스 검색 호출 ────────────────────────────────────────────
    // 💡 이 부분이 '외국인 가이드에게 한국어 이름을 보여주는' 핵심 과정이에요.
    //    야후 파이낸스의 search()는 종목명·티커 모두를 검색해줘요.
    const searchResult = await yahooFinance.search(query, {
      newsCount:   0,   // 뉴스는 필요 없어요, 종목만 가져와요
      quotesCount: 8,   // 최대 8개 받아서 필터링 후 5개만 반환
    })

    // ── 결과 가공 ──────────────────────────────────────────────────────────
    // 💡 야후가 준 '장부 목록'에서 주식 종목만 추려서 깔끔하게 정리해요.
    //    펀드·ETF·통화·암호화폐 등 주식이 아닌 것들은 걸러내요.
    const results = (searchResult.quotes ?? [])
      .filter((q) =>
        // EQUITY(주식)만 통과, 나머지(ETF, CURRENCY 등)는 제외
        q.quoteType === "EQUITY" && q.symbol
      )
      .slice(0, 5)   // 최대 5개
      .map((q) => {
        const symbol   = q.symbol!
        const exchange = (q as any).exchange ?? ""

        // 💡 한국 주식 특화 처리:
        //    야후 파이낸스는 한국 주식을 "005930.KS"처럼 .KS/.KQ 접미사와 함께 반환해요.
        //    그래서 symbol을 그대로 쓰면 바로 상세 페이지로 연결할 수 있어요!
        //    (별도 변환 로직 없이 야후가 이미 올바른 티커를 알려줘요)
        const isKorean = symbol.endsWith(".KS") || symbol.endsWith(".KQ")
        const market   = EXCHANGE_LABEL[exchange] ?? exchange

        return {
          ticker:   symbol,                                       // 예: "005930.KS", "AAPL"
          name:     (q as any).longname ?? (q as any).shortname ?? symbol,
          exchange: market,
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
