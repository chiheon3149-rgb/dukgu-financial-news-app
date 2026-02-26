import { Metadata } from "next"
import { supabase } from "@/lib/supabase"

// 💡 [핵심] 기획자님이 만들어두신 컴포넌트의 실제 경로로 연결합니다!
// 만약 components 폴더 안의 다른 위치라면 이 경로를 살짝 수정해주세요.
import { NewsDetailClient } from "@/components/dukgu/news-detail-client" 

// 1. [서버 사이드] 링크 복사용 메타데이터 생성
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: news } = await supabase
    .from("news")
    .select("headline, summary")
    .eq("id", params.id)
    .single()

  const ogImage = "https://www.dukgu.kr/og-image.png"

  return {
    title: `${news?.headline || "금융 뉴스"} | 덕구의 뉴스곳간`,
    description: news?.summary || "매일 아침, 당신을 위한 금융 뉴스 브리핑",
    openGraph: {
      title: news?.headline,
      description: news?.summary,
      url: `https://www.dukgu.kr/news/${params.id}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "article",
    },
  }
}

// 2. [서버 사이드] 페이지 진입점
export default function Page({ params }: { params: { id: string } }) {
  // 클라이언트 컴포넌트에게 id를 넘겨줍니다.
  return <NewsDetailClient id={params.id} />
}