/**
 * app/api/stock/[ticker]/route.ts
 * ================================
 * 💡 이 파일은 프론트엔드와 파이썬 백엔드를 연결하는 '통역사' 역할이에요.
 *
 *    클라이언트(브라우저)       →  이 API 라우트  →  파이썬 스크립트  →  야후 파이낸스
 *    GET /api/stock/AAPL  →  fetch_stock.py --raw AAPL  →  실시간 데이터
 *
 * 호출 예시:
 *   fetch("/api/stock/AAPL")
 *   fetch("/api/stock/005930.KS")
 */

import { NextRequest, NextResponse } from "next/server"
import { exec }                      from "child_process"
import { promisify }                  from "util"
import path                           from "path"

// 💡 exec()는 원래 콜백 방식이에요. promisify로 감싸서 async/await로 쓸 수 있게 해요.
//    마치 '오래된 전화기'를 '스마트폰처럼' 쓸 수 있게 바꾸는 것과 같아요!
const execAsync = promisify(exec)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  // 💡 URL에서 ticker 파라미터를 꺼내요. 예: /api/stock/AAPL → "AAPL"
  const { ticker } = await params

  // 보안: 티커 코드에 이상한 문자가 없는지 확인해요
  // 💡 마치 편지를 보내기 전에 주소가 올바른지 확인하는 것과 같아요!
  const sanitized = ticker.replace(/[^a-zA-Z0-9.\-]/g, "").toUpperCase()
  if (!sanitized) {
    return NextResponse.json(
      { error: true, message: "유효하지 않은 티커 코드예요." },
      { status: 400 }
    )
  }

  // 💡 파이썬 스크립트의 절대 경로를 만들어요.
  //    process.cwd()는 Next.js 프로젝트의 루트 폴더를 가리켜요.
  const scriptPath = path.join(process.cwd(), "scripts", "fetch_stock.py")

  try {
    // ── 파이썬 스크립트 실행 ──────────────────────────────────────────────
    // 💡 이 부분이 핵심이에요! Node.js가 파이썬 스크립트를 직접 실행해서
    //    stdout(표준 출력)으로 흘러나오는 JSON 문자열을 받아요.
    //    마치 '주방(파이썬)'에서 음식을 만들면 '웨이터(Node.js)'가 손님에게 전달하는 것처럼요!
    const { stdout } = await execAsync(
      `python "${scriptPath}" --raw ${sanitized}`,
      {
        timeout:  30_000, // 30초 내로 응답 없으면 포기해요
        maxBuffer: 5 * 1024 * 1024, // 최대 5MB (차트 데이터가 많아도 OK)
      }
    )

    // 💡 stdout에서 첫 번째 '{' 위치부터 잘라내요.
    //    파이썬 스크립트가 간혹 경고 메시지를 앞에 출력할 수도 있거든요.
    const jsonStart = stdout.indexOf("{")
    if (jsonStart === -1) {
      throw new Error("파이썬 스크립트가 JSON을 출력하지 않았어요.")
    }

    // ── JSON 파싱 & 반환 ───────────────────────────────────────────────────
    // 💡 문자열 → JavaScript 객체로 변환해요. 마치 편지봉투를 뜯는 것과 같아요!
    const data = JSON.parse(stdout.slice(jsonStart))
    return NextResponse.json(data)

  } catch (err) {
    // 💡 에러가 나도 프론트엔드가 깔끔하게 처리할 수 있도록 JSON 형태로 알려줘요.
    const message = err instanceof Error ? err.message : "알 수 없는 오류"
    console.error(`[API /stock/${sanitized}] 오류:`, message)

    return NextResponse.json(
      {
        error:   true,
        ticker:  sanitized,
        message: `데이터를 불러오지 못했어요. (${message})`,
      },
      { status: 500 }
    )
  }
}
