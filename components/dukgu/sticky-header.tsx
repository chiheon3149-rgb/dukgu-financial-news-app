import { Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function StickyHeader() {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          DUKGU
        </h1>

        <div className="flex items-center gap-3">
          <button
            className="relative p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label={"\uC54C\uB9BC"}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </button>

          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarImage src="https://api.dicebear.com/9.x/thumbs/svg?seed=dukgu&backgroundColor=c0aede" alt={"\uD504\uB85C\uD544"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">DK</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-accent-foreground bg-accent/20 px-2 py-0.5 rounded-full border border-accent/30">
              Lv.2
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
