"use client"

interface YoutubePlayerProps {
  videoId: string
}

export function YoutubePlayer({ videoId }: YoutubePlayerProps) {
  return (
    <div className="relative w-full pb-[56.25%] h-0 rounded-2xl overflow-hidden shadow-lg my-4">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}