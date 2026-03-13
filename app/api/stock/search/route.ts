/**
 * app/api/stock/search/route.ts
 * ==============================
 * 💡 이 API는 종목명(한글 포함)을 받아서 야후 파이낸스 장부 번호(티커)로 바꿔주는
 *    '외국인 가이드' 역할을 해요.
 *
 *    야후 파이낸스는 한글 검색을 지원하지 않아요.
 *    그래서 한글이 포함된 검색어는 내장 한국 종목 테이블에서 먼저 찾고,
 *    영문 검색어는 야후 API를 직접 호출해요.
 *
 * 호출 예시:
 *   GET /api/stock/search?q=삼성전자   ← 한글 → 로컬 테이블
 *   GET /api/stock/search?q=apple      ← 영문 → 야후 API
 *   GET /api/stock/search?q=AAPL       ← 티커 → 야후 API
 */

import { NextRequest, NextResponse } from "next/server"
import YahooFinanceClass from "yahoo-finance2"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinanceClass as any)()

// =============================================================================
// 📚 한국 종목 로컬 매핑 테이블
// 💡 야후 파이낸스가 한글을 읽지 못하기 때문에, 자주 찾는 한국 종목들을
//    이 '내장 사전'에 미리 정리해뒀어요.
//    사용자가 한글로 검색하면 야후 대신 이 사전을 먼저 열어봐요!
// =============================================================================
interface KrStock {
  ticker: string   // 야후 파이낸스 형식 (예: "005930.KS")
  name:   string   // 한국어 종목명
  market: string   // "코스피" | "코스닥"
}

const KR_STOCKS: KrStock[] = [
  // ── 코스피 대형주 (시가총액 상위) ─────────────────────────────────────────
  { ticker: "005930.KS", name: "삼성전자",          market: "코스피" },
  { ticker: "000660.KS", name: "SK하이닉스",        market: "코스피" },
  { ticker: "207940.KS", name: "삼성바이오로직스",  market: "코스피" },
  { ticker: "005380.KS", name: "현대차",            market: "코스피" },
  { ticker: "000270.KS", name: "기아",              market: "코스피" },
  { ticker: "051910.KS", name: "LG화학",            market: "코스피" },
  { ticker: "035420.KS", name: "NAVER",             market: "코스피" },
  { ticker: "006400.KS", name: "삼성SDI",           market: "코스피" },
  { ticker: "035720.KS", name: "카카오",            market: "코스피" },
  { ticker: "068270.KS", name: "셀트리온",          market: "코스피" },
  { ticker: "105560.KS", name: "KB금융",            market: "코스피" },
  { ticker: "055550.KS", name: "신한지주",          market: "코스피" },
  { ticker: "086790.KS", name: "하나금융지주",      market: "코스피" },
  { ticker: "005490.KS", name: "POSCO홀딩스",       market: "코스피" },
  { ticker: "032830.KS", name: "삼성생명",          market: "코스피" },
  { ticker: "003550.KS", name: "LG",               market: "코스피" },
  { ticker: "011200.KS", name: "HMM",              market: "코스피" },
  { ticker: "012330.KS", name: "현대모비스",        market: "코스피" },
  { ticker: "018260.KS", name: "삼성에스디에스",    market: "코스피" },
  { ticker: "015760.KS", name: "한국전력",          market: "코스피" },
  { ticker: "034730.KS", name: "SK",               market: "코스피" },
  { ticker: "017670.KS", name: "SK텔레콤",         market: "코스피" },
  { ticker: "030200.KS", name: "KT",               market: "코스피" },
  { ticker: "032640.KS", name: "LG유플러스",       market: "코스피" },
  { ticker: "066570.KS", name: "LG전자",           market: "코스피" },
  { ticker: "003670.KS", name: "포스코퓨처엠",     market: "코스피" },
  { ticker: "028260.KS", name: "삼성물산",         market: "코스피" },
  { ticker: "009150.KS", name: "삼성전기",         market: "코스피" },
  { ticker: "096770.KS", name: "SK이노베이션",     market: "코스피" },
  { ticker: "011070.KS", name: "LG이노텍",         market: "코스피" },
  { ticker: "047050.KS", name: "포스코인터내셔널", market: "코스피" },
  { ticker: "010130.KS", name: "고려아연",         market: "코스피" },
  { ticker: "000100.KS", name: "유한양행",         market: "코스피" },
  { ticker: "326030.KS", name: "SK바이오팜",       market: "코스피" },
  { ticker: "036570.KS", name: "엔씨소프트",       market: "코스피" },
  { ticker: "251270.KS", name: "넷마블",           market: "코스피" },
  { ticker: "009830.KS", name: "한화솔루션",       market: "코스피" },
  { ticker: "042660.KS", name: "한화오션",         market: "코스피" },
  { ticker: "139480.KS", name: "이마트",           market: "코스피" },
  { ticker: "069960.KS", name: "현대백화점",       market: "코스피" },
  { ticker: "010950.KS", name: "S-Oil",            market: "코스피" },
  { ticker: "001040.KS", name: "CJ",               market: "코스피" },
  { ticker: "097950.KS", name: "CJ제일제당",       market: "코스피" },
  { ticker: "000810.KS", name: "삼성화재",         market: "코스피" },
  { ticker: "085620.KS", name: "미래에셋증권",     market: "코스피" },
  { ticker: "006800.KS", name: "미래에셋증권2우B", market: "코스피" },
  { ticker: "024110.KS", name: "기업은행",         market: "코스피" },
  { ticker: "000720.KS", name: "현대건설",         market: "코스피" },
  { ticker: "011780.KS", name: "금호석유화학",     market: "코스피" },
  { ticker: "029780.KS", name: "삼성카드",         market: "코스피" },
  { ticker: "138040.KS", name: "메리츠금융지주",   market: "코스피" },
  { ticker: "000880.KS", name: "한화",             market: "코스피" },
  { ticker: "004020.KS", name: "현대제철",         market: "코스피" },
  { ticker: "008560.KS", name: "메리츠증권",       market: "코스피" },
  { ticker: "023530.KS", name: "롯데쇼핑",         market: "코스피" },
  { ticker: "071050.KS", name: "한국금융지주",     market: "코스피" },
  { ticker: "180640.KS", name: "한진칼",           market: "코스피" },
  { ticker: "003490.KS", name: "대한항공",         market: "코스피" },
  { ticker: "000670.KS", name: "영풍",             market: "코스피" },
  { ticker: "007070.KS", name: "GS리테일",         market: "코스피" },
  { ticker: "002790.KS", name: "아모레G",          market: "코스피" },
  { ticker: "090430.KS", name: "아모레퍼시픽",     market: "코스피" },
  { ticker: "006360.KS", name: "GS건설",           market: "코스피" },
  { ticker: "005940.KS", name: "NH투자증권",       market: "코스피" },
  { ticker: "000150.KS", name: "두산",             market: "코스피" },
  { ticker: "042670.KS", name: "HD현대인프라코어", market: "코스피" },
  { ticker: "267250.KS", name: "HD현대",           market: "코스피" },
  { ticker: "329180.KS", name: "HD현대중공업",     market: "코스피" },
  { ticker: "010620.KS", name: "HD현대미포",       market: "코스피" },
  { ticker: "009540.KS", name: "HD한국조선해양",   market: "코스피" },
  { ticker: "161390.KS", name: "한국타이어앤테크놀로지", market: "코스피" },
  { ticker: "004170.KS", name: "신세계",           market: "코스피" },
  { ticker: "001300.KS", name: "종근당홀딩스",     market: "코스피" },
  { ticker: "185750.KS", name: "종근당",           market: "코스피" },
  { ticker: "003230.KS", name: "삼양식품",         market: "코스피" },
  { ticker: "111770.KS", name: "영원무역",         market: "코스피" },
  { ticker: "271560.KS", name: "오리온",           market: "코스피" },
  { ticker: "282330.KS", name: "BGF리테일",        market: "코스피" },
  { ticker: "021240.KS", name: "코웨이",           market: "코스피" },
  { ticker: "008770.KS", name: "호텔신라",         market: "코스피" },
  { ticker: "016360.KS", name: "삼성증권",         market: "코스피" },
  { ticker: "006110.KS", name: "삼성SDI우",        market: "코스피" },
  { ticker: "033780.KS", name: "KT&G",             market: "코스피" },
  { ticker: "047810.KS", name: "한국항공우주",     market: "코스피" },
  { ticker: "000040.KS", name: "KYK",              market: "코스피" },
  { ticker: "018880.KS", name: "하이트진로",       market: "코스피" },
  { ticker: "005830.KS", name: "DB손해보험",       market: "코스피" },
  { ticker: "000240.KS", name: "한국타이어앤테크놀로지우", market: "코스피" },
  { ticker: "007310.KS", name: "오뚜기",           market: "코스피" },
  { ticker: "001800.KS", name: "오리온홀딩스",     market: "코스피" },
  { ticker: "006280.KS", name: "녹십자",           market: "코스피" },
  { ticker: "145720.KS", name: "덴티움",           market: "코스피" },
  { ticker: "302440.KS", name: "SK바이오사이언스",  market: "코스피" },
  { ticker: "214150.KS", name: "클래시스",         market: "코스피" },
  { ticker: "334970.KS", name: "위스크아로",       market: "코스피" },
  { ticker: "003000.KS", name: "부광약품",         market: "코스피" },
  { ticker: "128940.KS", name: "한미약품",         market: "코스피" },
  { ticker: "009200.KS", name: "무림페이퍼",       market: "코스피" },
  { ticker: "004840.KS", name: "DRB동일",          market: "코스피" },
  { ticker: "000990.KS", name: "DB하이텍",         market: "코스피" },
  { ticker: "000220.KS", name: "유유제약",         market: "코스피" },
  { ticker: "008300.KS", name: "남선알미늄",       market: "코스피" },
  { ticker: "007160.KS", name: "사조씨푸드",       market: "코스피" },
  { ticker: "051600.KS", name: "한전KPS",          market: "코스피" },
  { ticker: "020560.KS", name: "아시아나항공",     market: "코스피" },
  { ticker: "014680.KS", name: "한솔케미칼",       market: "코스피" },
  { ticker: "120110.KS", name: "코오롱인더",       market: "코스피" },
  { ticker: "001720.KS", name: "신영증권",         market: "코스피" },
  { ticker: "000210.KS", name: "대림산업",         market: "코스피" },
  { ticker: "071320.KS", name: "지역난방공사",     market: "코스피" },
  { ticker: "003600.KS", name: "SK케미칼",         market: "코스피" },
  { ticker: "001390.KS", name: "KG케미칼",         market: "코스피" },
  { ticker: "019170.KS", name: "신풍제약",         market: "코스피" },
  { ticker: "025540.KS", name: "한국단자",         market: "코스피" },
  { ticker: "005180.KS", name: "빙그레",           market: "코스피" },
  { ticker: "014910.KS", name: "성문전자",         market: "코스피" },
  { ticker: "008930.KS", name: "한미사이언스",     market: "코스피" },
  { ticker: "011160.KS", name: "롯데케미칼",       market: "코스피" },
  { ticker: "023960.KS", name: "에쓰씨엔지니어링", market: "코스피" },
  { ticker: "016380.KS", name: "KG스틸",           market: "코스피" },
  { ticker: "001750.KS", name: "한양증권",         market: "코스피" },
  { ticker: "029530.KS", name: "신도리코",         market: "코스피" },
  { ticker: "003240.KS", name: "태광산업",         market: "코스피" },
  { ticker: "108670.KS", name: "LX하우시스",       market: "코스피" },
  { ticker: "010780.KS", name: "아이에스동서",     market: "코스피" },
  { ticker: "033240.KS", name: "자화전자",         market: "코스피" },
  { ticker: "001680.KS", name: "대상",             market: "코스피" },
  { ticker: "002380.KS", name: "KCC",              market: "코스피" },
  { ticker: "010060.KS", name: "OCI홀딩스",        market: "코스피" },
  { ticker: "039130.KS", name: "하나투어",         market: "코스피" },
  { ticker: "298040.KS", name: "효성중공업",       market: "코스피" },
  { ticker: "004800.KS", name: "효성",             market: "코스피" },
  { ticker: "007340.KS", name: "롯데손보",         market: "코스피" },
  { ticker: "011790.KS", name: "SKC",              market: "코스피" },
  { ticker: "009240.KS", name: "한샘",             market: "코스피" },
  { ticker: "005870.KS", name: "휴니드",           market: "코스피" },
  { ticker: "001690.KS", name: "대한제당",         market: "코스피" },
  { ticker: "002350.KS", name: "넥센타이어",       market: "코스피" },
  { ticker: "000080.KS", name: "하이트진로홀딩스", market: "코스피" },
  { ticker: "021680.KS", name: "매직마이크로",     market: "코스피" },
  { ticker: "020150.KS", name: "일진전기",         market: "코스피" },
  { ticker: "069620.KS", name: "대웅제약",         market: "코스피" },
  { ticker: "001020.KS", name: "페이퍼코리아",     market: "코스피" },
  { ticker: "003380.KS", name: "하이트론",         market: "코스피" },
  { ticker: "095720.KS", name: "웅진씽크빅",       market: "코스피" },
  { ticker: "006490.KS", name: "인트론바이오",     market: "코스피" },
  { ticker: "282690.KS", name: "동원F&B",          market: "코스피" },
  // ── 코스닥 대형주 (시가총액 상위) ─────────────────────────────────────────
  { ticker: "247540.KQ", name: "에코프로비엠",     market: "코스닥" },
  { ticker: "086520.KQ", name: "에코프로",         market: "코스닥" },
  { ticker: "091990.KQ", name: "셀트리온헬스케어", market: "코스닥" },
  { ticker: "196170.KQ", name: "알테오젠",         market: "코스닥" },
  { ticker: "263750.KQ", name: "펄어비스",         market: "코스닥" },
  { ticker: "112040.KQ", name: "위메이드",         market: "코스닥" },
  { ticker: "041510.KQ", name: "에스엠",           market: "코스닥" },
  { ticker: "035900.KQ", name: "JYP Ent.",         market: "코스닥" },
  { ticker: "122870.KQ", name: "와이지엔터테인먼트", market: "코스닥" },
  { ticker: "095340.KQ", name: "ISC",             market: "코스닥" },
  { ticker: "293490.KQ", name: "카카오게임즈",     market: "코스닥" },
  { ticker: "357780.KQ", name: "솔브레인",         market: "코스닥" },
  { ticker: "039030.KQ", name: "이오테크닉스",     market: "코스닥" },
  { ticker: "066970.KQ", name: "엘앤에프",         market: "코스닥" },
  { ticker: "064760.KQ", name: "티씨케이",         market: "코스닥" },
  { ticker: "237690.KQ", name: "에스티팜",         market: "코스닥" },
  { ticker: "078340.KQ", name: "컴투스",           market: "코스닥" },
  { ticker: "058470.KQ", name: "리노공업",         market: "코스닥" },
  { ticker: "060720.KQ", name: "KH바텍",           market: "코스닥" },
  { ticker: "131970.KQ", name: "두산테스나",       market: "코스닥" },
  { ticker: "049430.KQ", name: "코스맥스",         market: "코스닥" },
  { ticker: "086900.KQ", name: "메디톡스",         market: "코스닥" },
  { ticker: "214150.KQ", name: "클래시스",         market: "코스닥" },
  { ticker: "214140.KQ", name: "이지케어텍",       market: "코스닥" },
  { ticker: "226340.KQ", name: "본느",             market: "코스닥" },
  { ticker: "059270.KQ", name: "해성디에스",       market: "코스닥" },
  { ticker: "025900.KQ", name: "동화기업",         market: "코스닥" },
  { ticker: "032830.KQ", name: "삼성생명",         market: "코스닥" },
  { ticker: "054620.KQ", name: "APS홀딩스",        market: "코스닥" },
  { ticker: "353200.KQ", name: "대덕전자",         market: "코스닥" },
  { ticker: "000250.KQ", name: "삼천당제약",       market: "코스닥" },
  { ticker: "082740.KQ", name: "HLB글로벌",        market: "코스닥" },
  { ticker: "028300.KQ", name: "HLB",              market: "코스닥" },
  { ticker: "039200.KQ", name: "오스코텍",         market: "코스닥" },
  { ticker: "083790.KQ", name: "크리스탈지노믹스", market: "코스닥" },
  { ticker: "950200.KQ", name: "파마리서치",       market: "코스닥" },
  { ticker: "205540.KQ", name: "뷰노",             market: "코스닥" },
  { ticker: "317530.KQ", name: "캐리소프트",       market: "코스닥" },
  { ticker: "370090.KQ", name: "퓨리오사AI",       market: "코스닥" },
  { ticker: "140860.KQ", name: "파크시스템스",     market: "코스닥" },
  { ticker: "950130.KQ", name: "엑세스바이오",     market: "코스닥" },
  { ticker: "036450.KQ", name: "한국가스공사",     market: "코스닥" },
  { ticker: "147870.KQ", name: "파마리서치프로덕트", market: "코스닥" },
  { ticker: "048260.KQ", name: "오스템임플란트",   market: "코스닥" },
  { ticker: "137310.KQ", name: "에스디생명공학",   market: "코스닥" },
  { ticker: "048870.KQ", name: "에이치엘비파워",   market: "코스닥" },
  { ticker: "033790.KQ", name: "스카이라이프",     market: "코스닥" },
  { ticker: "240810.KQ", name: "원익IPS",          market: "코스닥" },
  { ticker: "101490.KQ", name: "에스앤에스텍",     market: "코스닥" },
  { ticker: "090460.KQ", name: "비에이치",         market: "코스닥" },
  { ticker: "256840.KQ", name: "한국비엔씨",       market: "코스닥" },
  { ticker: "018310.KQ", name: "삼목에스폼",       market: "코스닥" },
  { ticker: "183300.KQ", name: "코미팜",           market: "코스닥" },
  { ticker: "051500.KQ", name: "CJ프레시웨이",     market: "코스닥" },
  { ticker: "083500.KQ", name: "에프엔에스테크",   market: "코스닥" },
  { ticker: "114840.KQ", name: "아이패밀리에스씨", market: "코스닥" },
  { ticker: "019570.KQ", name: "리더스기술투자",   market: "코스닥" },
  { ticker: "053580.KQ", name: "웹케시",           market: "코스닥" },
  { ticker: "067310.KQ", name: "하나마이크론",     market: "코스닥" },
  { ticker: "204270.KQ", name: "제이앤티씨",       market: "코스닥" },
  { ticker: "064290.KQ", name: "인텍플러스",       market: "코스닥" },
  { ticker: "009540.KQ", name: "HD한국조선해양",   market: "코스닥" },
  { ticker: "005290.KQ", name: "동진쎄미켐",       market: "코스닥" },
  { ticker: "054180.KQ", name: "PN풍년",           market: "코스닥" },
  { ticker: "036810.KQ", name: "에프에스티",       market: "코스닥" },
  { ticker: "102940.KQ", name: "코오롱생명과학",   market: "코스닥" },
  { ticker: "119860.KQ", name: "커넥트웨이브",     market: "코스닥" },
  { ticker: "182400.KQ", name: "피씨엘",           market: "코스닥" },
  { ticker: "298380.KQ", name: "에이비엘바이오",   market: "코스닥" },
  { ticker: "348370.KQ", name: "엔켐",             market: "코스닥" },
  { ticker: "222080.KQ", name: "씨아이에스",       market: "코스닥" },
  { ticker: "039440.KQ", name: "에스티아이",       market: "코스닥" },
  { ticker: "065680.KQ", name: "우주일렉트로",     market: "코스닥" },
  { ticker: "317870.KQ", name: "엔젤로보틱스",     market: "코스닥" },
  { ticker: "403870.KQ", name: "HPSP",             market: "코스닥" },
  { ticker: "264900.KQ", name: "크래프톤",         market: "코스닥" },
  { ticker: "035420.KQ", name: "NAVER",            market: "코스닥" },
  { ticker: "377300.KQ", name: "카카오페이",       market: "코스닥" },
  { ticker: "035510.KQ", name: "신세계인터내셔날", market: "코스닥" },
  { ticker: "003550.KQ", name: "LG",              market: "코스닥" },
  { ticker: "241590.KQ", name: "화승엔터프라이즈", market: "코스닥" },
  { ticker: "140410.KQ", name: "메지온",           market: "코스닥" },
  { ticker: "005290.KQ", name: "동진쎄미켐",       market: "코스닥" },
  { ticker: "023800.KQ", name: "인지컨트롤스",     market: "코스닥" },
  { ticker: "052600.KQ", name: "나노엔텍",         market: "코스닥" },
  { ticker: "200130.KQ", name: "콜마비앤에이치",   market: "코스닥" },
  { ticker: "069080.KQ", name: "웹젠",             market: "코스닥" },
  { ticker: "035760.KQ", name: "CJ ENM",           market: "코스닥" },
  { ticker: "091810.KQ", name: "티웨이항공",       market: "코스닥" },
  { ticker: "006730.KQ", name: "서울반도체",       market: "코스닥" },
  { ticker: "108230.KQ", name: "테크윙",           market: "코스닥" },
  { ticker: "200710.KQ", name: "에이디테크놀로지", market: "코스닥" },
  { ticker: "003380.KQ", name: "하이트론",         market: "코스닥" },
  { ticker: "056360.KQ", name: "인터파크쇼핑",     market: "코스닥" },
  { ticker: "045020.KQ", name: "웰크론한텍",       market: "코스닥" },
  { ticker: "007660.KQ", name: "이수페타시스",     market: "코스닥" },
  { ticker: "039020.KQ", name: "이건산업",         market: "코스닥" },
  { ticker: "071840.KQ", name: "하이소닉",         market: "코스닥" },
  { ticker: "252990.KQ", name: "샘씨엔에스",       market: "코스닥" },
  { ticker: "950170.KQ", name: "JTC",              market: "코스닥" },
  { ticker: "173940.KQ", name: "에프앤가이드",     market: "코스닥" },
  { ticker: "040350.KQ", name: "크레버스",         market: "코스닥" },
  { ticker: "238040.KQ", name: "피앤피시큐어",     market: "코스닥" },
  { ticker: "218410.KQ", name: "다원시스",         market: "코스닥" },
  { ticker: "143240.KQ", name: "세종메디칼",       market: "코스닥" },
  { ticker: "900340.KQ", name: "윙입푸드",         market: "코스닥" },
  { ticker: "059100.KQ", name: "아이컴포넌트",     market: "코스닥" },
  { ticker: "035080.KQ", name: "인터파크",         market: "코스닥" },
  { ticker: "006580.KQ", name: "대양제지",         market: "코스닥" },
  { ticker: "122310.KQ", name: "이엔에프테크놀로지", market: "코스닥" },
]

// =============================================================================
// 🔍 한글 여부 판별
// 💡 유니코드 범위로 한글이 포함됐는지 확인해요.
// =============================================================================
function hasKorean(str: string): boolean {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(str)
}

// =============================================================================
// 거래소 코드 → 표시 이름
// =============================================================================
const EXCHANGE_LABEL: Record<string, string> = {
  KSC: "코스피",
  KOE: "코스닥",
  NMS: "나스닥",
  NYQ: "NYSE",
  NGM: "나스닥",
  PCX: "NYSE아카",
  ASE: "아멕스",
  TYO: "도쿄",
  HKG: "홍콩",
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  // ── 한글 검색: 로컬 테이블에서 찾기 ────────────────────────────────────────
  // 💡 야후가 한글을 모르기 때문에, 내장 사전을 펼쳐서 먼저 찾아봐요.
  //    종목명 앞부분이나 중간에 검색어가 포함되면 결과로 내보내요.
  if (hasKorean(query)) {
    const matched = KR_STOCKS
      .filter((s) => s.name.includes(query))
      .slice(0, 5)
      .map((s) => ({
        ticker:   s.ticker,
        name:     s.name,
        exchange: s.market,
        isKorean: true,
      }))

    return NextResponse.json({ results: matched })
  }

  // ── 숫자만 입력된 경우: 한국 종목코드로 간주 ─────────────────────────────
  // 💡 "032640" 처럼 숫자 6자리를 입력하면 .KS/.KQ 종목으로 간주하고 찾아줘요.
  if (/^\d{5,6}$/.test(query)) {
    const matched = KR_STOCKS
      .filter((s) => s.ticker.startsWith(query))
      .slice(0, 5)
      .map((s) => ({
        ticker:   s.ticker,
        name:     s.name,
        exchange: s.market,
        isKorean: true,
      }))

    if (matched.length > 0) {
      return NextResponse.json({ results: matched })
    }

    // 로컬에 없으면 .KS를 붙여서 야후에 직접 조회
    const withSuffix = `${query}.KS`
    return NextResponse.json({
      results: [{
        ticker:   withSuffix,
        name:     withSuffix,
        exchange: "코스피",
        isKorean: true,
      }],
    })
  }

  // ── 영문/티커 검색: 야후 파이낸스 API 호출 ──────────────────────────────
  // 💡 영문 검색어는 야후 파이낸스 가이드에게 직접 물어봐요.
  try {
    const searchResult = await yahooFinance.search(query, {
      newsCount:   0,
      quotesCount: 8,
    })

    const results = (searchResult.quotes ?? [])
      .filter((q: any) => q.quoteType === "EQUITY" && q.symbol)
      .slice(0, 5)
      .map((q: any) => {
        const symbol   = q.symbol
        const exchange = q.exchange ?? ""
        const isKorean = symbol.endsWith(".KS") || symbol.endsWith(".KQ")

        return {
          ticker:   symbol,
          name:     q.longname ?? q.shortname ?? symbol,
          exchange: EXCHANGE_LABEL[exchange] ?? exchange,
          isKorean,
        }
      })

    return NextResponse.json({ results })

  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류"
    console.error("[API /stock/search]", message)
    return NextResponse.json({ results: [], error: message }, { status: 500 })
  }
}
