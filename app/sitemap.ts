import { MetadataRoute } from "next"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dukgu.kr"

// 정적 공개 페이지
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: `${BASE_URL}/`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/news`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/briefing`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/community`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/notice`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  // 뉴스 동적 라우트
  const { data: newsItems } = await supabase
    .from("news")
    .select("id, updated_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const newsRoutes: MetadataRoute.Sitemap = (newsItems ?? []).map((item) => ({
    url: `${BASE_URL}/news/${item.id}`,
    lastModified: new Date(item.updated_at ?? Date.now()),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  // 브리핑 동적 라우트
  const { data: briefingItems } = await supabase
    .from("briefings")
    .select("id, updated_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const briefingRoutes: MetadataRoute.Sitemap = (briefingItems ?? []).map((item) => ({
    url: `${BASE_URL}/briefing/${item.id}`,
    lastModified: new Date(item.updated_at ?? Date.now()),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  // 커뮤니티 동적 라우트
  const { data: communityItems } = await supabase
    .from("community_posts")
    .select("id, updated_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const communityRoutes: MetadataRoute.Sitemap = (communityItems ?? []).map((item) => ({
    url: `${BASE_URL}/community/${item.id}`,
    lastModified: new Date(item.updated_at ?? Date.now()),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  return [...STATIC_ROUTES, ...newsRoutes, ...briefingRoutes, ...communityRoutes]
}
