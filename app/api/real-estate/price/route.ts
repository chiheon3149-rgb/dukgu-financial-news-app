import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lawdCd = searchParams.get('lawdCd');
  const dealYm = searchParams.get('dealYm');
  const serviceKey = process.env.MOLIT_SERVICE_KEY;

  if (!lawdCd || !dealYm || !serviceKey) {
    return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
  }

  // 💡 [유레카 포인트!] 과장님이 신청하신 'Dev' 엔드포인트로 주소를 완전히 바꿨습니다.
  const url = `http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?serviceKey=${serviceKey}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYm}&pageNo=1&numOfRows=1000`;

  try {
    const response = await fetch(url);
    const xmlData = await response.text();

    console.log(`\n========== [${dealYm} 국토부 원문 응답] ==========`);
    console.log(xmlData.substring(0, 300)); 
    console.log(`====================================================\n`);

    if (xmlData.trim() === "Unexpected errors" || xmlData.includes("SERVICE ERROR")) {
       return NextResponse.json({ 
           error: "API 키가 아직 국토부 서버에 동기화되지 않았거나 권한이 없습니다. (최대 24시간 소요)" 
       }, { status: 401 });
    }

    if (xmlData.includes("<returnAuthMsg>")) {
      return NextResponse.json({ error: "API 인증키 대기 중입니다." }, { status: 401 });
    }

    const parser = new XMLParser();
    const jsonData = parser.parse(xmlData);
    
    const resultCode = jsonData?.response?.header?.resultCode;
    if (resultCode && String(resultCode) !== '00') {
       const errMsg = jsonData?.response?.header?.resultMsg;
       return NextResponse.json({ error: `API 오류: ${errMsg}` }, { status: 400 });
    }

    const items = jsonData?.response?.body?.items?.item || [];
    return NextResponse.json(Array.isArray(items) ? items : [items]);
    
  } catch (error: any) {
    console.error("❌ 통신 에러:", error.message);
    return NextResponse.json({ error: "서버 연결에 실패했습니다." }, { status: 500 });
  }
}