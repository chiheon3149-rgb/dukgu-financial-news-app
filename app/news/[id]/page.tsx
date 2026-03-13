import { Metadata } from "next"
import { supabase } from "@/lib/supabase"
import { NewsDetailClient } from "@/components/dukgu/news-detail-client" 

// 💡 Next.js 최신 버전에 맞춰 params 상자(Promise) 타입을 정의합니다.
type Props = {
  params: Promise<{ id: string }>
}

// 1. [서버 사이드] 메타데이터 생성
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 💡 상자(Promise)를 까서 id를 확실하게 꺼냅니다!
  const resolvedParams = await params
  const id = resolvedParams.id

  const { data: news } = await supabase
    .from("news")
    .select("headline, body_summary")
    .eq("id", id)
    .single()

  const ogImage = "https://www.dukgu.kr/og-image.png"
  const desc = news?.body_summary?.slice(0, 150) || "매일 아침, 당신을 위한 금융 뉴스 브리핑"

  return {
    title: `${news?.headline || "금융 뉴스"} | 덕구의 뉴스곳간`,
    description: desc,
    openGraph: {
      title: news?.headline,
      description: desc,
      url: `https://www.dukgu.kr/news/${id}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "article",
    },
  }
}

// 2. [서버 사이드] 페이지 진입점
export default async function Page({ params }: Props) {
  // 💡 여기서도 상자(Promise)를 까서 id를 꺼낸 다음 클라이언트에게 전달합니다!
  const resolvedParams = await params

  return <NewsDetailClient id={resolvedParams.id} />
}