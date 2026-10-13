import { useEffect, useRef, useState } from 'react';

// 錄音對照：錄音只留在這個頁面的記憶體中，不存檔也不上傳（設計 INV-1、Q6）
export default function Recorder({ onPlayOriginal }) {
  const [status, setStatus] = useState('idle'); // idle | recording | ready | error
  const [audioUrl, setAudioUrl] = useState('');
  const recorder = useRef(null);
  const chunks = useRef([]);

  // 換新錄音或離開頁面時，釋放舊錄音
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setAudioUrl(URL.createObjectURL(new Blob(chunks.current, { type: rec.mimeType })));
        setStatus('ready');
      };
      rec.start();
      recorder.current = rec;
      setStatus('recording');
    } catch {
      setStatus('error');
    }
  };

  const stop = () => recorder.current?.stop();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="recorder">
      {status === 'recording'
        ? <button type="button" onClick={stop} className="!bg-red-600 text-white">⏹ 停止錄音</button>
        : <button type="button" onClick={start} className="!bg-rose-700 text-white">🎙 錄音</button>}
      {onPlayOriginal && <button type="button" onClick={onPlayOriginal}>▶ 播放原句</button>}
      {status === 'ready' && <audio src={audioUrl} controls data-testid="my-recording" className="h-9" />}
      {status === 'error' && <span className="text-amber-300 text-sm">無法使用麥克風，請在瀏覽器允許麥克風權限後再試。</span>}
    </div>
  );
}
