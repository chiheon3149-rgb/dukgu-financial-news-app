"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lightbulb, Trophy, AlertCircle, Sparkles, Lock, CheckCircle, XCircle, Bone } from "lucide-react"
// 💡 공통 부품 수입
import { DetailHeader } from "@/components/dukgu/detail-header"

const quizData = {
  politics: { id: "politics", title: "정치", icon: "🏛️", color: "from-purple-500/80 to-indigo-600/80", weeks: [{ q: "다음 중 대한민국 국회의원의 임기는?", options: ["2년", "3년", "4년", "5년"], answer: 2, hint: "올림픽 개최 주기와 같습니다." }] },
  economy: { id: "economy", title: "경제", icon: "📈", color: "from-emerald-400/80 to-green-600/80", weeks: [{ q: "기초자산을 보유한 상태에서 콜옵션을 매도하여 안정적인 배당 수익을 추구하는 ETF 투자 전략은?", options: ["커버드콜", "숏셀링", "스트랭글", "스윙트레이딩"], answer: 0, hint: "최근 인기 있는 고배당 전략입니다." }] },
  society: { id: "society", title: "사회", icon: "🤝", color: "from-amber-400/80 to-orange-500/80", weeks: [{ q: "저출산, 고령화로 인해 생산가능인구가 급감하는 현상을 뜻하는 용어는?", options: ["인구 데드크로스", "인구 오너스", "인구 절벽", "인구 지진"], answer: 2, hint: "낭떠러지처럼 뚝 떨어지는 현상입니다." }] },
  culture: { id: "culture", title: "문화", icon: "🎨", color: "from-pink-400/90 to-rose-500/90", weeks: [{ q: "한국 전통 가옥에서 방과 방 사이에 있는 큰 마루를 뜻하는 순우리말은?", options: ["대청", "툇마루", "사랑채", "안채"], answer: 0, hint: "여름에 시원한 넓은 마루입니다." }] },
}

type Category = keyof typeof quizData;

export default function TriviaPage() {
  const router = useRouter()
  const currentWeekIdx = 0 
  const [step, setStep] = useState<"select" | "quiz" | "result">("select")
  const [selectedCat, setSelectedCat] = useState<Category | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [solvedStatus, setSolvedStatus] = useState<Record<string, {solved: boolean, correct: boolean}>>({})

  useEffect(() => {
    const loadedStatus = JSON.parse(localStorage.getItem("solvedTrivia") || "{}")
    setSolvedStatus(loadedStatus)
  }, [])

  const handleSelect = (cat: Category) => {
    if (solvedStatus[`week${currentWeekIdx + 1}_${cat}`]?.solved) {
      alert("이번 주 이미 도전한 분야입니다! 결과는 카드 하단에서 확인하세요.")
      return
    }
    setSelectedCat(cat)
    setStep("quiz")
    setSelectedOption(null)
    setShowHint(false)
  }

  const handleSubmit = () => {
    if (!selectedCat || selectedOption === null) return
    const correct = quizData[selectedCat].weeks[currentWeekIdx].answer === selectedOption
    setIsCorrect(correct)
    setStep("result")

    const newStatus = { ...solvedStatus, [`week${currentWeekIdx + 1}_${selectedCat}`]: { solved: true, correct: correct } }
    setSolvedStatus(newStatus)
    localStorage.setItem("solvedTrivia", JSON.stringify(newStatus))
  }

  return (
    <div className="min-h-dvh bg-[url('https://i.ifh.cc/GGjN8Q.webp')] bg-cover bg-center bg-no-repeat bg-fixed pb-20 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"></div>

      {/* 📌 공통 헤더 부품 적용: 화이트 폰트 모드(isDark) 활성화 */}
      <DetailHeader 
        title="덕구의 상식 퀴즈" 
        isDark={true}
        rightElement={<Bone className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />}
        onBack={() => {
          // 💡 퀴즈 단계에 따른 뒤로가기 로직 커스텀
          if (step === "select") {
            router.push("/") // 분야 선택창이면 홈으로
          } else {
            setStep("select") // 문제/결과창이면 분야 선택창으로
          }
        }}
      />

      <main className="container max-w-md mx-auto px-4 py-6 relative z-10">
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl relative">
          
          {/* 🎭 무대 1: 분야 선택창 */}
          {step === "select" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-sm font-medium text-white/90 mb-1 drop-shadow-sm">정답을 맞추고 덕구에게 먹이를 주세요!</p>
              <h2 className="text-2xl font-extrabold text-white mb-6 drop-shadow-md flex items-center gap-2">상식 퀴즈 도전장 🐾</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(quizData) as Category[]).map((key, idx) => {
                  const data = quizData[key]
                  const isLocked = idx !== currentWeekIdx
                  const status = solvedStatus[`week${currentWeekIdx + 1}_${key}`]

                  return (
                    <button 
                      key={key}
                      onClick={() => !isLocked && !status?.solved && handleSelect(key)}
                      disabled={isLocked || status?.solved}
                      className={`relative overflow-hidden p-4 rounded-2xl border border-white/30 transition-all duration-300 text-left h-40 flex flex-col justify-between
                        ${isLocked ? 'bg-gray-900/50 grayscale opacity-70' : status?.solved ? 'bg-black/30' : `bg-gradient-to-br ${data.color} hover:scale-105 shadow-md`}
                      `}
                    >
                      <div>
                        <span className="text-3xl mb-1 block drop-shadow-md">{data.icon}</span>
                        <h3 className="text-white font-bold text-lg drop-shadow-md leading-tight">{data.title} 영역</h3>
                      </div>
                      
                      {/* 우측 하단 미션 성공/실패 뱃지 */}
                      <div className="flex flex-col items-end gap-1">
                        {status?.solved ? (
                          <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                            <span className={`text-[10px] font-black ${status.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {status.correct ? '미션 성공' : '미션 실패'}
                            </span>
                            <div className={`p-1 rounded-full ${status.correct ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                              {status.correct ? <CheckCircle className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full">
                            <span className="text-[10px] text-white/60 font-bold">도전 가능</span>
                            <div className="bg-white/20 p-1 rounded-full">
                              <Bone className="w-3 h-3 text-white/70" />
                            </div>
                          </div>
                        )}
                      </div>

                      {isLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white/50 mr-1" />
                          <span className="text-white font-bold text-xs">{idx + 1}주차 오픈</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🎭 무대 2: 퀴즈 풀기 스테이지 */}
          {step === "quiz" && selectedCat && (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-white">
              <div className={`rounded-2xl bg-gradient-to-br ${quizData[selectedCat].color} p-5 mb-6 border border-white/20 shadow-inner`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold bg-black/20 w-fit px-2 py-1 rounded border border-white/10">{quizData[selectedCat].title}</p>
                  <Sparkles className="w-4 h-4 text-white/40 animate-pulse" />
                </div>
                <h2 className="text-lg font-bold leading-snug drop-shadow-md">Q. {quizData[selectedCat].weeks[currentWeekIdx].q}</h2>
              </div>

              {/* 4지선다 옵션 */}
              <div className="flex flex-col gap-3 mb-8">
                {quizData[selectedCat].weeks[currentWeekIdx].options.map((opt, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedOption(idx)} 
                    className={`p-4 rounded-xl border-2 font-bold text-left transition-all backdrop-blur-md shadow-sm active:scale-95
                      ${selectedOption === idx ? 'bg-white text-slate-800 border-white shadow-lg' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* 제출 버튼 & 힌트 */}
              <div className="space-y-4">
                <button 
                  onClick={handleSubmit} 
                  disabled={selectedOption === null} 
                  className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl
                    ${selectedOption !== null ? 'bg-white text-slate-900 scale-[1.02]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                >
                  답안 제출하기
                </button>

                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => setShowHint(!showHint)} 
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white/60 hover:text-white bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" /> 힌트 보기
                  </button>
                  {showHint && (
                    <div className="mt-4 p-4 bg-amber-100/90 backdrop-blur-md border border-amber-300 rounded-xl text-xs font-bold text-amber-900 animate-in fade-in slide-in-from-top-2 w-full text-center shadow-md">
                      💡 {quizData[selectedCat].weeks[currentWeekIdx].hint}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 🎭 무대 3: 결과 스테이지 */}
          {step === "result" && (
            <div className="flex flex-col items-center py-10 text-white text-center animate-in zoom-in-95">
              {isCorrect ? (
                <div className="relative">
                  <Trophy className="w-20 h-20 text-yellow-300 mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-200 animate-pulse" />
                </div>
              ) : (
                <AlertCircle className="w-20 h-20 text-rose-400 mb-6 drop-shadow-[0_0_15px_rgba(251,113,113,0.5)]" />
              )}
              <h2 className="text-3xl font-black mb-3 drop-shadow-md">
                {isCorrect ? '정답입니다!' : '아쉽네요!'}
              </h2>
              <p className="mb-10 text-sm font-medium opacity-90 leading-relaxed">
                {isCorrect ? '덕구가 배불리 먹고 경험치(+10)를 얻었어요!\n쑥쑥 자라는 덕구를 기대해 주세요.' : '이번 주 도전은 여기까지입니다.\n더 공부해서 다음 주에 다시 만나요!'}
              </p>
              <button 
                onClick={() => setStep("select")} 
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold border border-white/20 transition-all shadow-md active:scale-95"
              >
                다른 분야 확인하기
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}