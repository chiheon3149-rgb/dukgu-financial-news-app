"""
fetch_stock.py
==============
yfinance를 사용해 주식 데이터를 가져오는 유틸리티 모듈이에요.

사용 예시:
  # 모듈로 import해서 쓸 때
  from fetch_stock import fetch_stock_data
  result = fetch_stock_data("AAPL")

  # 스크립트로 직접 실행할 때 (사람이 읽기 좋은 출력)
  python fetch_stock.py AAPL
  python fetch_stock.py 005930.KS   ← 한국 주식은 뒤에 .KS 붙여요

  # Next.js API 라우트에서 호출할 때 (JSON 만 출력)
  python fetch_stock.py --raw AAPL
"""

import json
import sys
import datetime
from typing import Any

# 💡 yfinance: 야후 파이낸스에서 주식 데이터를 무료로 가져오는 라이브러리예요.
#    마치 야후 파이낸스 웹사이트의 '뒷문'으로 데이터를 조용히 가져오는 것과 같아요!
#    설치: pip install yfinance
try:
    import yfinance as yf
except ImportError:
    print("❌ yfinance가 설치되지 않았어요. 아래 명령어로 설치해 주세요:")
    print("   pip install yfinance")
    sys.exit(1)


# =============================================================================
# 🔧 숫자 포맷 헬퍼
# 💡 None이 들어와도 에러 없이 안전하게 처리해줘요.
#    마치 '값이 없으면 빈 자리로 놔두기' 같은 안전장치예요.
# =============================================================================

def _safe(value: Any, default: Any = None) -> Any:
    """None이나 NaN이면 default를 반환해요."""
    if value is None:
        return default
    try:
        import math
        if math.isnan(float(value)):
            return default
    except (TypeError, ValueError):
        pass
    return value


def _fmt_market_cap(raw: Any) -> str:
    """시가총액을 사람이 읽기 쉬운 단위로 바꿔요. (예: 3_300_000_000_000 → 3.3조)"""
    v = _safe(raw)
    if v is None:
        return "-"
    v = float(v)
    if v >= 1_000_000_000_000:
        return f"{v / 1_000_000_000_000:.1f}조"
    if v >= 100_000_000:
        return f"{int(v / 100_000_000)}억"
    return f"{int(v):,}"


def _fmt_volume(raw: Any) -> str:
    """거래량을 읽기 쉽게 바꿔요. (예: 12_345_678 → 1,234만주)"""
    v = _safe(raw)
    if v is None:
        return "-"
    v = int(v)
    if v >= 10_000:
        return f"{v // 10_000:,}만주"
    return f"{v:,}주"


def _fmt_per(raw: Any) -> str:
    """PER을 소수점 1자리로 표시해요."""
    v = _safe(raw)
    return f"{float(v):.1f}배" if v is not None else "-"


def _fmt_yield(raw: Any) -> str:
    """배당수익률: 0.021 → '2.10%' 형식으로 변환해요."""
    v = _safe(raw)
    return f"{float(v) * 100:.2f}%" if v is not None else "-"


def _fmt_price(raw: Any, currency: str = "USD") -> str:
    """주가를 통화에 맞게 포맷해요."""
    v = _safe(raw)
    if v is None:
        return "-"
    if currency == "KRW":
        return f"{int(v):,}원"
    return f"${float(v):.2f}"


# =============================================================================
# 🚀 메인 함수: 주식 데이터 가져오기
# 💡 이 함수는 야후 파이낸스에서 데이터를 가져와서
#    프론트엔드가 바로 쓸 수 있는 'JSON 도시락통'으로 포장해줘요!
# =============================================================================

def fetch_stock_data(ticker: str) -> dict:
    """
    주식 종목 코드(ticker)를 받아서 프로필 정보와 차트 데이터를 반환해요.

    Args:
        ticker: 종목 코드 (예: "AAPL", "TSLA", "005930.KS")

    Returns:
        dict:
        {
            "error": False,
            "ticker": "AAPL",
            "fetched_at": "2026-03-12T10:00:00Z",
            "profile": { ... },
            "chart_data": [ {"date": "...", "close": 0.0}, ... ]
        }
    """
    ticker = ticker.strip().upper()

    # ── Ticker 객체 생성 ─────────────────────────────────────────────────────
    # 💡 Ticker 객체는 야후 파이낸스의 '특정 회사 서랍장'이에요.
    try:
        stock = yf.Ticker(ticker)
        info  = stock.info
    except Exception as e:
        return {"error": True, "ticker": ticker, "message": f"Ticker 객체 생성 실패: {str(e)}"}

    # ── 종목 유효성 검사 ──────────────────────────────────────────────────────
    if not info or info.get("quoteType") is None:
        return {"error": True, "ticker": ticker, "message": f"'{ticker}'는 존재하지 않거나 지원하지 않는 종목이에요."}

    # ── 통화 감지 ─────────────────────────────────────────────────────────────
    currency = info.get("currency", "USD")

    # ── 현재가 & 등락 정보 ────────────────────────────────────────────────────
    # 💡 currentPrice → regularMarketPrice 순으로 시도해요.
    current_price = _safe(info.get("currentPrice") or info.get("regularMarketPrice"))
    prev_close    = _safe(info.get("previousClose") or info.get("regularMarketPreviousClose"))

    if current_price is not None and prev_close is not None and float(prev_close) != 0:
        # 💡 전일 종가 기준으로 등락금액과 등락률을 직접 계산해요.
        change_amount = float(current_price) - float(prev_close)
        change_rate   = (change_amount / float(prev_close)) * 100
    else:
        # 야후 파이낸스 제공값으로 대체
        change_amount = _safe(info.get("regularMarketChange"), 0) or 0
        change_rate   = _safe(info.get("regularMarketChangePercent"), 0) or 0

    # ── CEO 이름 추출 ──────────────────────────────────────────────────────────
    # 💡 임원 목록(companyOfficers)에서 'CEO' 직함을 가진 분을 찾아요.
    officers = info.get("companyOfficers") or []
    ceo = next((o.get("name", "-") for o in officers if "CEO" in (o.get("title") or "")), None)
    if ceo is None and officers:
        ceo = officers[0].get("name", "-")
    ceo = ceo or "-"

    # ── 상장일 변환 ────────────────────────────────────────────────────────────
    # 💡 Unix 타임스탬프(숫자)를 사람이 읽기 좋은 날짜로 변환해요.
    first_trade_ts = info.get("firstTradeDateEpochUtc")
    if first_trade_ts:
        try:
            listing_date = datetime.datetime.utcfromtimestamp(int(first_trade_ts)).strftime("%Y년 %m월 %d일")
        except Exception:
            listing_date = "-"
    else:
        listing_date = "-"

    # ── 프로필 데이터 조립 ────────────────────────────────────────────────────
    # 💡 회사 명함을 예쁘게 인쇄하는 작업이에요.
    profile = {
        # 회사 기본 정보
        "name":                _safe(info.get("longName") or info.get("shortName"), ticker),
        "currency":            currency,
        "exchange":            _safe(info.get("exchange"), "-"),
        "sector":              _safe(info.get("sector"), "-"),
        "industry":            _safe(info.get("industry"), "-"),
        "country":             _safe(info.get("country"), "-"),
        "website":             _safe(info.get("website"), "-"),
        "full_time_employees": _safe(info.get("fullTimeEmployees")),

        # 회사 설명 (영문 원문)
        "summary": _safe(info.get("longBusinessSummary"), "정보 없음"),

        # 경영진 & 상장일
        "ceo":          ceo,
        "listing_date": listing_date,

        # ★ 현재가 & 등락 정보 (프론트엔드 메인 숫자에 표시돼요)
        "current_price": _safe(current_price),
        "change_amount": round(float(change_amount), 4),
        "change_rate":   round(float(change_rate),   4),
        "prev_close":    _safe(prev_close),

        # 시가총액
        "market_cap":     _safe(info.get("marketCap")),
        "market_cap_fmt": _fmt_market_cap(info.get("marketCap")),

        # PER
        "per":     _safe(info.get("trailingPE") or info.get("forwardPE")),
        "per_fmt": _fmt_per(info.get("trailingPE") or info.get("forwardPE")),

        # 배당수익률
        "dividend_yield":     _safe(info.get("dividendYield")),
        "dividend_yield_fmt": _fmt_yield(info.get("dividendYield")),

        # 52주 최고/최저
        "52w_high":     _safe(info.get("fiftyTwoWeekHigh")),
        "52w_high_fmt": _fmt_price(info.get("fiftyTwoWeekHigh"), currency),
        "52w_low":      _safe(info.get("fiftyTwoWeekLow")),
        "52w_low_fmt":  _fmt_price(info.get("fiftyTwoWeekLow"), currency),

        # 거래량
        "volume":     _safe(info.get("volume")),
        "volume_fmt": _fmt_volume(info.get("volume")),
    }

    # ── 차트용 과거 주가 데이터 ───────────────────────────────────────────────
    # 💡 1년치 일별 종가를 뽑아요. 기간 탭(1일/1주/1달/1년)은 프론트에서 슬라이싱해요.
    try:
        hist = stock.history(period="1y", interval="1d")
        if hist.empty:
            chart_data = []
        else:
            chart_data = [
                {"date": date.strftime("%Y-%m-%d"), "close": round(float(close), 4)}
                for date, close in zip(hist.index, hist["Close"])
                if close is not None
            ]
    except Exception as e:
        chart_data = []
        profile["chart_error"] = f"차트 데이터 로드 실패: {str(e)}"

    return {
        "error":      False,
        "ticker":     ticker,
        "fetched_at": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "profile":    profile,
        "chart_data": chart_data,
    }


# =============================================================================
# 📦 여러 종목 한 번에 가져오기 (배치 처리)
# =============================================================================

def fetch_multiple(tickers: list[str]) -> list[dict]:
    results = []
    for t in tickers:
        print(f"  📡 {t} 데이터 수집 중...", flush=True)
        result = fetch_stock_data(t)
        results.append(result)
        if result.get("error"):
            print(f"  ❌ {t}: {result['message']}")
        else:
            n = len(result.get("chart_data", []))
            print(f"  ✅ {t}: 차트 {n}일치 완료")
    return results


# =============================================================================
# 🖥️ CLI 진입점
# 사용법: python fetch_stock.py AAPL
#         python fetch_stock.py AAPL TSLA 005930.KS
#         python fetch_stock.py --raw AAPL    ← JSON만 출력 (Next.js API용)
# =============================================================================

if __name__ == "__main__":
    args = sys.argv[1:]

    # 💡 --raw 플래그: 꾸밈 없이 JSON 한 줄만 출력해요.
    #    Next.js API 라우트가 stdout을 파싱할 때 쓰는 모드예요.
    raw_mode = "--raw" in args
    if raw_mode:
        args = [a for a in args if a != "--raw"]

    if not args:
        print("사용법: python fetch_stock.py <티커코드> [티커코드2 ...]")
        print("예시:  python fetch_stock.py AAPL")
        print("예시:  python fetch_stock.py --raw AAPL   ← JSON만 출력 (API용)")
        sys.exit(1)

    if len(args) == 1:
        data = fetch_stock_data(args[0])
    else:
        data = fetch_multiple(args)

    if raw_mode:
        print(json.dumps(data, ensure_ascii=False))
    else:
        print(f"\n📊 총 {len(args)}개 종목 데이터 수집 시작\n")
        print("\n" + "=" * 60)
        print(json.dumps(data, ensure_ascii=False, indent=2))
