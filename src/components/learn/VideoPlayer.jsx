import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// 兩種播放器（YouTube 嵌入、本機影片檔）提供同一組操作：
// seek(秒)、play()、pause()、setRate(倍速)、getTime()、setCaptions(開/關)

let ytApiPromise = null;
// 載入 YouTube 官方 IFrame Player API（只載入一次）
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });
  }
  return ytApiPromise;
}

// YouTube 錯誤碼：101、150 表示上傳者禁止嵌入
const YT_ERRORS = {
  2: '影片網址有誤，請確認後再貼一次。',
  5: '這部影片無法在網頁播放器播放。',
  100: '找不到這部影片，可能已被刪除或設為私人。',
  101: '這部影片不允許嵌入，請改用其他片段或本機影片檔。',
  150: '這部影片不允許嵌入，請改用其他片段或本機影片檔。',
};

const YouTubePlayer = forwardRef(function YouTubePlayer({ videoId, onError }, ref) {
  const holder = useRef(null);
  const player = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const target = document.createElement('div');
    holder.current.appendChild(target);

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      player.current = new YT.Player(target, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, rel: 0 },
        events: { onError: (e) => onError?.(YT_ERRORS[e.data] || `YouTube 播放器發生錯誤（代碼 ${e.data}）。`) },
      });
    });

    return () => {
      cancelled = true;
      player.current?.destroy?.();
      player.current = null;
      target.remove();
    };
  }, [videoId, onError]);

  useImperativeHandle(ref, () => ({
    seek: (t) => player.current?.seekTo?.(t, true),
    play: () => player.current?.playVideo?.(),
    pause: () => player.current?.pauseVideo?.(),
    setRate: (r) => player.current?.setPlaybackRate?.(r),
    getTime: () => player.current?.getCurrentTime?.() ?? 0,
    // YouTube 字幕模組不是正式文件化的介面，失敗時讓使用者自己按播放器的 CC 按鈕
    setCaptions: (on) => {
      try {
        if (on) player.current?.loadModule?.('captions');
        else player.current?.unloadModule?.('captions');
      } catch { /* 忽略 */ }
    },
  }), []);

  return <div ref={holder} data-testid="youtube-player" className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />;
});

const LocalPlayer = forwardRef(function LocalPlayer({ url }, ref) {
  const video = useRef(null);

  useImperativeHandle(ref, () => ({
    seek: (t) => { if (video.current) video.current.currentTime = t; },
    play: () => video.current?.play().catch(() => {}),
    pause: () => video.current?.pause(),
    setRate: (r) => { if (video.current) video.current.playbackRate = r; },
    getTime: () => video.current?.currentTime ?? 0,
    setCaptions: () => {},
  }), []);

  return <video ref={video} src={url} controls data-testid="local-player" className="w-full h-full bg-black" />;
});

// source: { type: 'youtube', videoId } 或 { type: 'local', url, name }
const VideoPlayer = forwardRef(function VideoPlayer({ source }, ref) {
  // 換來源時由外層以 key 重新建立元件，錯誤訊息會自動清除
  const [error, setError] = useState('');

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      {source.type === 'youtube'
        ? <YouTubePlayer ref={ref} videoId={source.videoId} onError={setError} />
        : <LocalPlayer ref={ref} url={source.url} />}
      {error && (
        <div role="alert" className="absolute inset-0 flex items-center justify-center bg-black/85 p-6 text-center text-amber-300">
          {error}
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;
