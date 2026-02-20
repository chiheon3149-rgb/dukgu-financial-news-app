"use client"

interface BriefingHeroProps {
  date: string;
  title: string;
  description: string;
  emoji?: string;
  // 💡 오전/오후 테마를 위해 배경색을 선택할 수 있게 만들었습니다.
  variant?: "morning" | "afternoon"; 
}

export function BriefingHero({ 
  date, 
  title, 
  description, 
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
        <p className="text-blue-100 text-sm font-semibold mb-2 drop-shadow-sm">
          {date}
        </p>
        <h2 className="text-2xl font-black leading-tight mb-2 drop-shadow-md whitespace-pre-wrap">
          {title}
        </h2>
        <p className="text-sm text-blue-50 font-medium opacity-90 leading-relaxed">
          {description}
        </p>
      </div>
      
      {/* 하단 유리 질감 광택 효과 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
    </section>
  )
}