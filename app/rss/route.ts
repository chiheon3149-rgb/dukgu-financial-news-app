import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

// =============================================================================
// 📡 RSS 피드 — /rss
//
// 구글 애드센스 심사 및 크롤러를 위한 표준 RSS 2.0 피드입니다.
// Next.js ISR로 1시간마다 재생성됩니다.
// =============================================================================

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dukgu.kr"

export async function GET() {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from("news")
    .select("id, headline, summary, category, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return new NextResponse("RSS 피드를 생성하는 중 오류가 발생했습니다.", { status: 500 })
  }

  const items = (data ?? [])
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.headline}]]></title>
      <link>${SITE_URL}/news/${item.id}</link>
      <description><![CDATA[${item.summary ?? "덕구에서 전하는 금융 뉴스 브리핑입니다."}]]></description>
      <category><![CDATA[${item.category ?? "경제"}]]></category>
      <pubDate>${new Date(item.created_at).toUTCString()}</pubDate>
      <guid isPermaLink="true">${SITE_URL}/news/${item.id}</guid>
    </item>`
    )
    .join("")

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>덕구 금융 뉴스 브리핑</title>
    <link>${SITE_URL}</link>
    <description>매일 아침, 당신을 위한 금융 뉴스 브리핑</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  })
}
