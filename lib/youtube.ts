// lib/youtube.ts

export function getYoutubeId(url: string) {
  // 유튜브 주소의 다양한 패턴(일반 주소, 짧은 주소 등)을 다 잡아냅니다.
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}