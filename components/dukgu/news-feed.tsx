import { NewsCard } from "./news-card"
import { Clock } from "lucide-react"

const newsData = [
  {
    category: "\uACBD\uC81C" as const,
    headline: "\uD55C\uAD6D\uC740\uD589, \uAE30\uC900\uAE08\uB9AC \uB3D9\uACB0\u2026 \u2018\uCD94\uAC00 \uC778\uD558 \uC5EC\uC9C0 \uB0A8\uACA8\u2019",
    summary: "\uD55C\uAD6D\uC740\uD589\uC774 \uAE30\uC900\uAE08\uB9AC\uB97C 3.0%\uB85C \uB3D9\uACB0\uD558\uBA70 \uD5A5\uD6C4 \uACBD\uAE30 \uD750\uB984\uC744 \uC9C0\uCF1C\uBCF4\uACA0\uB2E4\uACE0 \uBC1D\uD614\uB2E4.",
    timeAgo: "1\uC2DC\uAC04 \uC804",
    goodCount: 128,
    badCount: 15,
    commentCount: 34,
  },
  {
    category: "\uAD6D\uC81C" as const,
    headline: "\uBBF8 \uC5F0\uC900 \uC758\uC0AC\uB85D \uACF5\uAC1C\u2026 \uAE08\uB9AC \uC778\uD558 \uC2DC\uADF8\uB110 \uAC15\uD654",
    summary: "\uC5F0\uBC29\uC900\uBE44\uC81C\uB3C4\uAC00 \uC62C\uD574 \uD558\uBC18\uAE30 \uAE08\uB9AC \uC778\uD558 \uAC00\uB2A5\uC131\uC744 \uC2DC\uC0AC\uD558\uBA70 \uAE00\uB85C\uBC8C \uC2DC\uC7A5\uC774 \uBC18\uC0C9\uD588\uB2E4.",
    timeAgo: "2\uC2DC\uAC04 \uC804",
    goodCount: 256,
    badCount: 22,
    commentCount: 67,
  },
  {
    category: "\uAE30\uC5C5" as const,
    headline: "\uC0BC\uC131\uC804\uC790, AI \uBC18\uB3C4\uCCB4 \uC218\uC8FC 2\uC870\uC6D0 \uB3CC\uD30C",
    summary: "\uC0BC\uC131\uC804\uC790\uAC00 \uAE00\uB85C\uBC8C AI \uAE30\uC5C5\uB4E4\uB85C\uBD80\uD130 HBM \uBC18\uB3C4\uCCB4 \uB300\uADDC\uBAA8 \uC218\uC8FC\uC5D0 \uC131\uACF5\uD588\uB2E4.",
    timeAgo: "3\uC2DC\uAC04 \uC804",
    goodCount: 512,
    badCount: 8,
    commentCount: 89,
  },
  {
    category: "\uC815\uCE58" as const,
    headline: "\uC815\uBD80, \uD558\uBC18\uAE30 \uCD94\uACBD \uD3B8\uC131 \uAC80\uD1A0 \uCC29\uC218",
    summary: "\uACBD\uAE30 \uB454\uD654\uC5D0 \uB300\uC751\uD574 \uC815\uBD80\uAC00 \uD558\uBC18\uAE30 \uCD94\uAC00\uACBD\uC815\uC608\uC0B0 \uD3B8\uC131\uC744 \uACF5\uC2DD \uAC80\uD1A0\uD558\uAE30 \uC2DC\uC791\uD588\uB2E4.",
    timeAgo: "4\uC2DC\uAC04 \uC804",
    goodCount: 87,
    badCount: 45,
    commentCount: 123,
  },
  {
    category: "\uBD80\uB3D9\uC0B0" as const,
    headline: "\uC11C\uC6B8 \uC544\uD30C\uD2B8 \uB9E4\uB9E4\uAC00, 3\uC8FC \uC5F0\uC18D \uC0C1\uC2B9\uC138 \uC774\uC5B4\uAC00",
    summary: "\uAC15\uB0A8 3\uAD6C\uB97C \uC911\uC2EC\uC73C\uB85C \uC11C\uC6B8 \uC544\uD30C\uD2B8 \uB9E4\uB9E4\uAC00\uAC00 3\uC8FC \uC5F0\uC18D \uC624\uB984\uC138\uB97C \uAE30\uB85D\uD588\uB2E4.",
    timeAgo: "5\uC2DC\uAC04 \uC804",
    goodCount: 64,
    badCount: 98,
    commentCount: 201,
  },
  {
    category: "\uC0AC\uD68C" as const,
    headline: "MZ\uC138\uB300 \u2018\uCEE4\uD53C\uAC12 \uD22C\uC790\u2019 \uD2B8\uB80C\uB4DC \uD655\uC0B0",
    summary: "\uC6D4 \uCEE4\uD53C \uC9C0\uCD9C \uB300\uC2E0 \uC18C\uC561 \uD22C\uC790\uB97C \uC2DC\uC791\uD558\uB294 20-30\uB300\uAC00 \uAE09\uC99D\uD558\uACE0 \uC788\uB2E4.",
    timeAgo: "6\uC2DC\uAC04 \uC804",
    goodCount: 342,
    badCount: 12,
    commentCount: 156,
  },
]

export function NewsFeed() {
  return (
    <section className="px-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-3 mt-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground">{"\uC2E4\uC2DC\uAC04 \uB274\uC2A4"}</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-3">
        {newsData.map((news, index) => (
          <NewsCard key={index} {...news} />
        ))}
      </div>
    </section>
  )
}
