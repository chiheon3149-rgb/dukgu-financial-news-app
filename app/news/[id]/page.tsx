import { Metadata } from "next"
import { supabase } from "@/lib/supabase"

// 💡 링크 복사 시 보여줄 메타데이터를 동적으로 생성합니다.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // 1. DB에서 기사 정보를 가져옵니다.
  const { data: news } = await supabase
    .from("news")
    .select("headline, summary")
    .eq("id", params.id)
    .single()

  // 2. 고정으로 사용할 로고나 대표 이미지 경로
  const ogImage = "https://www.dukgu.kr/og-image.png" // 👈 미리 서버에 올려둔 고정 이미지 주소

  return {
    title: news?.headline || "덕구의 뉴스곳간",
    description: news?.summary || "매일 아침, 당신을 위한 금융 뉴스 브리핑",
    openGraph: {
      title: news?.headline || "덕구의 뉴스곳간",
      description: news?.summary || "금융 지식이 쑥쑥! 덕구와 함께해요.",
      url: `https://www.dukgu.kr/news/${params.id}`,
      images: [
        {
          url: ogImage, // 👈 여기에 기사별 이미지를 넣거나 고정 이미지를 넣으세요.
          width: 1200,
          height: 630,
          alt: news?.headline,
        },
      ],
      type: "article",
    },
    // 트위터(X) 대응
    twitter: {
      card: "summary_large_image",
      title: news?.headline,
      description: news?.summary,
      images: [ogImage],
    },
  }
}

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  // 기존 상세 페이지 렌더링 코드...
}