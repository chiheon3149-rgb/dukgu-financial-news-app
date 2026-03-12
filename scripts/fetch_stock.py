"""
fetch_stock.py
==============
yfinance를 사용해 주식 데이터를 가져오는 유틸리티 모듈이에요.

사용 예시:
  # 모듈로 import해서 쓸 때
  from fetch_stock import fetch_stock_data
  result = fetch_stock_data("AAPL")

  # 스크립트로 직접 실행할 때
  python fetch_stock.py AAPL
  python fetch_stock.py 005930.KS   ← 한국 주식은 뒤에 .KS 붙여요
"""

import json
import sys
from datetime import datetime
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
    # pandas의 NaN 처리
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
    """배당수익률: 0.021 → '2.1%' 형식으로 변환해요."""
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
        dict: 아래 구조의 딕셔너리
        {
            "ticker": "AAPL",
            "profile": { ... },
            "chart_data": [ {"date": "...", "close": 0.0}, ... ]
        }
        에러 발생 시:
        {
            "error": True,
            "ticker": "AAPL",
            "message": "에러 메시지"
        }
    """
    ticker = ticker.strip().upper()

    # ── A. Ticker 객체 생성 ─────────────────────────────────────────────────
    # 💡 Ticker 객체는 야후 파이낸스의 '특정 회사 서랍장'이에요.
    #    이 서랍장에서 info(명함), history(일기장) 등을 꺼낼 수 있어요!
    try:
        stock = yf.Ticker(ticker)
        info  = stock.info  # 회사 프로필 딕셔너리
    except Exception as e:
        return {
            "error": True,
            "ticker": ticker,
            "message": f"Ticker 객체 생성 실패: {str(e)}"
        }

    # ── 종목 유효성 검사 ────────────────────────────────────────────────────
    # 💡 없는 종목 코드를 입력하면 info에 의미있는 값이 거의 없어요.
    #    'quoteType'이 없으면 잘못된 종목으로 판단해요.
    if not info or info.get("quoteType") is None:
        return {
            "error": True,
            "ticker": ticker,
            "message": f"'{ticker}'는 존재하지 않거나 지원하지 않는 종목 코드예요."
        }

    # ── 통화 감지 (KRW인지 USD인지) ─────────────────────────────────────────
    currency = info.get("currency", "USD")

    # ── A. 프로필 데이터 조립 ───────────────────────────────────────────────
    # 💡 이 부분은 회사 명함을 예쁘게 인쇄하는 작업이에요.
    #    프론트엔드의 '주요 지표 타일'과 '회사 개요' 섹션에 들어가요.
    profile = {
        # 회사 요약 설명 (영문)
        "summary":        _safe(info.get("longBusinessSummary"), "정보 없음"),

        # 시가총액 (원시값 + 포맷팅된 표시값)
        "market_cap":     _safe(info.get("marketCap")),
        "market_cap_fmt": _fmt_market_cap(info.get("marketCap")),

        # PER — trailingPE 없으면 forwardPE로 대체
        "per":            _safe(info.get("trailingPE") or info.get("forwardPE")),
        "per_fmt":        _fmt_per(info.get("trailingPE") or info.get("forwardPE")),

        # 배당수익률 (0.021 → 2.1%)
        "dividend_yield":     _safe(info.get("dividendYield")),
        "dividend_yield_fmt": _fmt_yield(info.get("dividendYield")),

        # 52주 최고/최저
        "52w_high":     _safe(info.get("fiftyTwoWeekHigh")),
        "52w_high_fmt": _fmt_price(info.get("fiftyTwoWeekHigh"), currency),
        "52w_low":      _safe(info.get("fiftyTwoWeekLow")),
        "52w_low_fmt":  _fmt_price(info.get("fiftyTwoWeekLow"), currency),

        # 당일 거래량
        "volume":     _safe(info.get("volume")),
        "volume_fmt": _fmt_volume(info.get("volume")),

        # 추가 정보 (프론트엔드 회사 소개 카드용)
        "name":          _safe(info.get("longName") or info.get("shortName"), ticker),
        "sector":        _safe(info.get("sector"), "-"),
        "industry":      _safe(info.get("industry"), "-"),
        "website":       _safe(info.get("website"), "-"),
        "currency":      currency,
        "exchange":      _safe(info.get("exchange"), "-"),
        "country":       _safe(info.get("country"), "-"),
        "full_time_employees": _safe(info.get("fullTimeEmployees")),
    }

    # ── B. 차트용 과거 주가 데이터 ─────────────────────────────────────────
    # 💡 이 부분은 회사의 '주가 일기장'을 1년치 꺼내는 작업이에요.
    #    날짜(Date)와 종가(Close)만 쏙 뽑아서 깔끔하게 정리해요.
    try:
        hist = stock.history(period="1y", interval="1d")

        if hist.empty:
            chart_data = []
        else:
            chart_data = [
                {
                    "date":  date.strftime("%Y-%m-%d"),
                    "close": round(float(close), 4),
                }
                for date, close in zip(hist.index, hist["Close"])
                if close is not None
            ]
    except Exception as e:
        # 차트 데이터 실패해도 프로필은 반환해요
        chart_data = []
        profile["chart_error"] = f"차트 데이터 로드 실패: {str(e)}"

    # ── 최종 반환 ───────────────────────────────────────────────────────────
    # 💡 모든 재료가 준비됐어요! 이제 도시락통에 예쁘게 담아서 반환해요.
    return {
        "error":      False,
        "ticker":     ticker,
        "fetched_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "profile":    profile,
        "chart_data": chart_data,
    }


# =============================================================================
# 📦 여러 종목 한 번에 가져오기 (배치 처리)
# 💡 여러 주식 데이터를 한 번에 가져올 때 써요.
#    마치 도시락 여러 개를 한꺼번에 포장하는 것과 같아요!
# =============================================================================

def fetch_multiple(tickers: list[str]) -> list[dict]:
    """
    여러 종목 코드를 리스트로 받아서 결과 리스트를 반환해요.

    Args:
        tickers: ["AAPL", "TSLA", "005930.KS"]

    Returns:
        list[dict]: 각 종목의 fetch_stock_data 결과 리스트
    """
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
# 🖥️ CLI 진입점 — 터미널에서 직접 실행할 때
# 사용법: python fetch_stock.py AAPL
#         python fetch_stock.py AAPL TSLA 005930.KS
# =============================================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python fetch_stock.py <티커코드> [티커코드2 ...]")
        print("예시:  python fetch_stock.py AAPL")
        print("예시:  python fetch_stock.py AAPL TSLA 005930.KS")
        sys.exit(1)

    input_tickers = sys.argv[1:]

    print(f"\n📊 총 {len(input_tickers)}개 종목 데이터 수집 시작\n")

    if len(input_tickers) == 1:
        data = fetch_stock_data(input_tickers[0])
    else:
        data = fetch_multiple(input_tickers)

    # 결과를 JSON으로 예쁘게 출력해요
    print("\n" + "=" * 60)
    print(json.dumps(data, ensure_ascii=False, indent=2))
