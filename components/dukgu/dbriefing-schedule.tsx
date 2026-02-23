"use client"

import { CalendarDays } from "lucide-react"

// 💡 1. 'mode' 데이터를 받을 수 있게 입구 정의
interface DbriefingScheduleProps {
  mode: "US" | "KR"
  items?: ScheduleItemProps[]
}

interface ScheduleItemProps {
  dDay: string;
  title: string;
  description: string;
  isUrgent?: boolean;
}

// 💡 2. 함수 이름을 DbriefingSchedule로 바꿨습니다! (page.tsx와 일치)
export function DbriefingSchedule({ mode, items }: DbriefingScheduleProps) {
  
  // 💡 미국(오전) 데이터
  const usSchedules: ScheduleItemProps[] = [
    {
      dDay: "D-Day",
      title: "미 연방대법원 상호관세 위헌 여부 판결",
      description: "글로벌 공급망 대규모 패치 (오늘 밤 24:00 배포 예정)",
      isUrgent: true
    },
    {
      dDay: "D-1",
      title: "미국 1월 PCE 물가지수 발표",
      description: "연준 금리 로직의 핵심 데이터 업데이트 (2/21)",
      isUrgent: false
    }
  ];

  // 💡 한국(오후) 데이터
  const krSchedules: ScheduleItemProps[] = [
    {
      dDay: "D-5",
      title: "한은 금통위 금리 결정 회의",
      description: "국내 유동성 밸런스 패치 및 통화 정책 발표 (2/26)",
      isUrgent: true
    },
    {
      dDay: "D-7",
      title: "금융위 기업 밸류업 2차 세미나",
      description: "코스피 데이터 안정화 및 저PBR 시스템 점검",
      isUrgent: false
    }
  ];

  const data = items ?? (mode === "US" ? usSchedules : krSchedules)

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 mb-4 border-b pb-2">
        <CalendarDays className="w-5 h-5 text-amber-500" /> 
        [Patch Schedule] {mode === "US" ? "미국" : "국내"} 배포 일정
      </h3>
      
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div 
            key={idx} 
            className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm transition-all hover:bg-slate-100/50 group"
          >
            <div className={`text-[10px] font-black px-2 py-1 rounded shrink-0 mt-0.5 shadow-sm
              ${item.isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
              {item.dDay}
            </div>
            
            <div>
              <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                {item.title}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}