/**
 * 한국 종목 이름 매핑 CSV → Supabase 업로드 스크립트
 *
 * 사용법:
 *   node scripts/upload-kr-stocks.mjs [CSV_파일_경로]
 *
 * 예시:
 *   node scripts/upload-kr-stocks.mjs "C:/Users/디코코/Downloads/data_1815_20260313.csv"
 *
 * Supabase에 kr_stock_names 테이블이 먼저 생성되어 있어야 합니다.
 * (아래 SQL을 Supabase Dashboard > SQL Editor에서 실행)
 *
 * ─── SQL ──────────────────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS kr_stock_names (
 *   code       TEXT PRIMARY KEY,
 *   isin       TEXT,
 *   name       TEXT NOT NULL,
 *   full_name  TEXT,
 *   listed_at  TEXT,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ──────────────────────────────────────────────────────────────────────────────
 */

import fs from "fs"
import path from "path"

// ─── 설정 ─────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = "https://xzfnavxkpwsrmuyyklzr.supabase.co"
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Zm5hdnhrcHdzcm11eXlrbHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjU3NzEsImV4cCI6MjA4NzM0MTc3MX0.oA3sm_vOvhXRWFArlgNWz3aunJx_onIxCDIt4ewJEqQ"
const TABLE         = "kr_stock_names"
const BATCH_SIZE    = 500  // Supabase 1회 upsert 최대 권장

// ─── CSV 파싱 ─────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = []
  let current = ""
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === "," && !inQuote) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function loadCSV(filePath) {
  const buf  = fs.readFileSync(filePath)
  const text = new TextDecoder("euc-kr").decode(buf)
  const lines = text.trim().split("\n")

  const headers = parseCSVLine(lines[0])
  // 컬럼 인덱스
  const iIdx    = headers.indexOf("표준코드")
  const cIdx    = headers.indexOf("단축코드")
  const nIdx    = headers.indexOf("한글종목약명")
  const fnIdx   = headers.indexOf("한글종목명")
  const dIdx    = headers.indexOf("상장일")

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const code = cols[cIdx]?.replace(/"/g, "").trim()
    if (!code) continue

    rows.push({
      code,
      isin:      cols[iIdx]?.replace(/"/g, "").trim() || null,
      name:      cols[nIdx]?.replace(/"/g, "").trim() || code,
      full_name: cols[fnIdx]?.replace(/"/g, "").trim() || null,
      listed_at: cols[dIdx]?.replace(/"/g, "").trim() || null,
    })
  }
  return rows
}

// ─── Supabase upsert ──────────────────────────────────────────────────────────

async function upsertBatch(batch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":         SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer":        "resolution=merge-duplicates",  // upsert
    },
    body: JSON.stringify(batch),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase 오류 (${res.status}): ${err}`)
  }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error("사용법: node scripts/upload-kr-stocks.mjs <CSV_경로>")
    console.error('예시:  node scripts/upload-kr-stocks.mjs "C:/Users/디코코/Downloads/data_1815_20260313.csv"')
    process.exit(1)
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`파일을 찾을 수 없습니다: ${csvPath}`)
    process.exit(1)
  }

  console.log(`📂 CSV 읽는 중: ${path.basename(csvPath)}`)
  const rows = loadCSV(csvPath)
  console.log(`✅ 파싱 완료: ${rows.length}개 종목`)

  // 배치 분할 업로드
  let uploaded = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    await upsertBatch(batch)
    uploaded += batch.length
    console.log(`  ↑ ${uploaded}/${rows.length} 업로드 완료`)
  }

  console.log(`\n🎉 완료! Supabase [${TABLE}] 테이블에 ${rows.length}개 종목 저장됨`)
}

main().catch((err) => {
  console.error("❌ 오류:", err.message)
  process.exit(1)
})
