import type { Metadata } from "next"
import { createSupabaseServer } from "@/lib/supabase-server"
import { NewsDetailClient } from "@/components/dukgu/news-detail-client"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data } = await supabase
    .from("news")
    .select("headline, summary, ai_summary")
    .eq("id", id)
    .single()

  if (!data) {
    return {
      title: "덕구의 뉴스곳간",
      description: "매일 아침, 당신을 위한 금융 뉴스 브리핑",
    }
  }

  const description = (data.ai_summary ?? data.summary ?? "덕구의 뉴스곳간에서 확인하세요.").slice(0, 160)

  return {
    title: `${data.headline} | 덕구의 뉴스곳간`,
    description,
    openGraph: {
      title: data.headline,
      description,
      type: "article",
    },
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params
  return <NewsDetailClient id={id} />
}
