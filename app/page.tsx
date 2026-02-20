import { StickyHeader } from "@/components/dukgu/sticky-header"
import { HeroBanner } from "@/components/dukgu/hero-banner"
import { NewsFeed } from "@/components/dukgu/news-feed"
import { BottomNav } from "@/components/dukgu/bottom-nav"

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <StickyHeader />
      <main>
        <HeroBanner />
        <NewsFeed />
      </main>
      <BottomNav />
    </div>
  )
}
