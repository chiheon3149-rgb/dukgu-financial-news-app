"use client"

import { useState } from "react"
import { SearchBar } from "./search-bar"
import { NewsFeed } from "./news-feed"

export function NewsSection() {
  const [searchKeyword, setSearchKeyword] = useState("")

  return (
    <div className="pt-2">
      <SearchBar value={searchKeyword} onChange={setSearchKeyword} />
      <NewsFeed searchKeyword={searchKeyword} />
    </div>
  )
}
