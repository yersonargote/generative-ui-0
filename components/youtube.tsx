'use client'

import YouTube, { YouTubeProps } from 'react-youtube'

export function YoutubeVideo({ id }: { id: string }) {
  const opts: YouTubeProps['opts'] = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0
    }
  }
  return (
    <div className="flex flex-col items-center">
      <YouTube videoId={id} opts={opts} />
    </div>
  )
}
