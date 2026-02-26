// lib/youtube.ts

export function getYoutubeIds(content: string): string[] {
  // 유튜브 주소 패턴을 찾는 정규표현식 (전역 검색 'g' 옵션 추가)
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  
  const matches = [...content.matchAll(regExp)];
  // 중복된 영상은 하나만 나오도록 Set을 써서 정리해줍니다.
  return Array.from(new Set(matches.map(match => match[1])));
}