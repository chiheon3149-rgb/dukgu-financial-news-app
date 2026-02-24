"use client"

interface BriefingHeroProps {
  date: string;
  title: string;
  description: string;
  tags?: string[]; // 💡 태그 데이터를 받을 수 있도록 추가
  emoji?: string;
  variant?: "morning" | "afternoon"; 
}

export function BriefingHero({ 
  date, 
  title, 
  description, 
  tags = [], // 💡 기본값은 빈 배열
  emoji = "🚀", 
  variant = "morning" 
}: BriefingHeroProps) {
  
  // 테마에 따른 그라데이션 결정 (오전: 블루계열, 오후: 오렌지/인디고 계열)
  const themeClass = variant === "morning" 
    ? "from-blue-600 to-indigo-700" 
    : "from-orange-500 to-indigo-800";

  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${themeClass} p-6 shadow-xl text-white transition-all duration-500`}>
      {/* 배경 장식 아이콘 */}
      <div className="absolute -top-6 -right-6 text-7xl opacity-10 rotate-12 pointer-events-none select-none">
        {emoji}
      </div>
      
      {/* 컨텐츠 영역 */}
      <div className="relative z-10">
        {/* 1. 날짜 */}
        <p className="text-blue-100 text-[11px] font-bold mb-3 drop-shadow-sm opacity-80">
          {date}
        </p>

        {/* 💡 2. 태그 영역 (제목 위로 배치) */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}

        {/* 3. 제목 (헤드라인) */}
        <h2 className="text-2xl font-black leading-tight mb-2.5 drop-shadow-md whitespace-pre-wrap">
          {title}
        </h2>

        {/* 4. 설명 (요약문) */}
        <p className="text-[13px] text-blue-50 font-medium opacity-90 leading-relaxed break-keep">
          {description}
        </p>
      </div>
      
      {/* 하단 유리 질감 광택 효과 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
    </section>
  )
}