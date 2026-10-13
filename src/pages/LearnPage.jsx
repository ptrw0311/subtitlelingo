import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { movieDB, subtitleDB } from '../config/turso-api';
import useProgress from '../hooks/useProgress';
import { parseSrt, findLineAt } from '../utils/srt';
import { parseYouTubeId, rangeAction } from '../utils/playback';
import {
  toggleStep, recommendedStep, addLineRep, setLinePassed, addFullRound,
  addSegment, updateSegment, removeSegment, addSegmentRep,
  addVocab, removeVocab, exportState, importState,
} from '../utils/progress-store';
import StepBar from '../components/learn/StepBar';
import { STEPS } from '../components/learn/steps';
import VideoPlayer from '../components/learn/VideoPlayer';
import SegmentPanel from '../components/learn/SegmentPanel';
import LinePanel, { ClickableText } from '../components/learn/LinePanel';
import Recorder from '../components/learn/Recorder';

const RATES = [0.5, 0.75, 1, 1.25];

// 100LS 五步驟學習頁
export default function LearnPage() {
  const { movieId } = useParams();
  const [searchParams] = useSearchParams();
  const { state, movie, updateThisMovie, updateAll, replaceAll } = useProgress(movieId);

  const [info, setInfo] = useState(null);
  const [lines, setLines] = useState([]);
  const [loadError, setLoadError] = useState('');
  // 網址可帶 ?step=N 直接開某一步（例如首頁的「跟讀練習」），否則開建議的下一步
  const [step, setStep] = useState(() => {
    const fromUrl = Number(searchParams.get('step'));
    return fromUrl >= 1 && fromUrl <= 5 ? fromUrl : recommendedStep(movie) ?? 5;
  });

  // 影片來源：YouTube 網址存在進度裡；本機檔案只在這次開啟期間有效
  const [localFile, setLocalFile] = useState(null);
  const [sourceType, setSourceType] = useState(movie.youtubeUrl ? 'youtube' : 'local');
  const [urlInput, setUrlInput] = useState(movie.youtubeUrl);
  const [urlError, setUrlError] = useState('');
  const [zhLines, setZhLines] = useState([]);

  const player = useRef(null);
  const [time, setTime] = useState(0);
  const [rate, setRate] = useState(1);
  const [range, setRange] = useState(null); // { start, end, loop, lineIndex?, segmentId? }
  const [lastRange, setLastRange] = useState(null); // 最近播放的句子或段落，供錄音對照「播放原句」
  const [notice, setNotice] = useState('');

  // 載入影片資訊和英文字幕（資料庫只讀取，不寫入）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, s] = await Promise.all([movieDB.getById(movieId), subtitleDB.getByMovieId(movieId)]);
        if (cancelled) return;
        setInfo(m.data?.[0] || null);
        setLines(parseSrt(s.data?.[0]?.srt_content));
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [movieId]);

  const youtubeId = parseYouTubeId(movie.youtubeUrl);
  const source = useMemo(() => {
    if (sourceType === 'youtube' && youtubeId) return { type: 'youtube', videoId: youtubeId };
    if (sourceType === 'local' && localFile) return { type: 'local', url: localFile.url, name: localFile.name };
    return null;
  }, [sourceType, youtubeId, localFile]);

  useEffect(() => () => { if (localFile) URL.revokeObjectURL(localFile.url); }, [localFile]);

  // 每 0.1 秒讀一次播放位置：更新字幕，並處理 A-B 重複和單句停止
  useEffect(() => {
    if (!source) return undefined;
    const id = setInterval(() => {
      const t = player.current?.getTime() ?? 0;
      setTime(t);
      const action = rangeAction(t, range);
      if (action === 'loop') player.current.seek(range.start);
      if (action === 'stop') { player.current.pause(); setRange(null); }
    }, 100);
    return () => clearInterval(id);
  }, [source, range]);

  useEffect(() => { player.current?.setRate(rate); }, [rate, source]);

  // YouTube 內建字幕：步驟 3、4 打開，其他步驟關掉（盡力而為，也可以自己按 CC）
  useEffect(() => { player.current?.setCaptions(step === 3 || step === 4); }, [step, source]);

  const offset = movie.subtitleOffset || 0;
  const currentIndex = findLineAt(lines, time, offset);
  const zhIndex = findLineAt(zhLines, time, offset);
  const savedWords = useMemo(
    () => new Set(state.vocab.filter((v) => v.movieId === movieId).map((v) => v.word)),
    [state.vocab, movieId],
  );

  const flash = (text) => { setNotice(text); setTimeout(() => setNotice(''), 2500); };

  // 沒有影片來源時，用瀏覽器內建的電腦朗讀當備用（不是演員原聲）
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return flash('這個瀏覽器不支援電腦朗讀。');
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const playRange = (start, end, extra) => {
    if (!player.current) return;
    setRange({ start, end, ...extra });
    setLastRange({ start, end, ...extra });
    player.current.seek(start);
    player.current.play();
  };

  const playLine = (line) => {
    if (!source) return speak(line.text);
    return playRange(line.start + offset, line.end + offset, { loop: false, lineIndex: line.index });
  };

  const onWord = useCallback((token, sentence) => {
    updateAll((s) => addVocab(s, { word: token, sentence, movieId }));
    flash(`已加入生字本：${token.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '')}`);
  }, [updateAll, movieId]);

  const saveUrl = () => {
    if (!parseYouTubeId(urlInput)) return setUrlError('這不是 YouTube 影片網址，例如 https://www.youtube.com/watch?v=xxxxxxxxxxx');
    setUrlError('');
    setSourceType('youtube');
    setRange(null);
    return updateThisMovie((m) => ({ ...m, youtubeUrl: urlInput.trim() }));
  };

  const pickLocal = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRange(null);
    setSourceType('local');
    setLocalFile({ url: URL.createObjectURL(file), name: file.name });
  };

  const pickZh = async (e) => {
    const file = e.target.files?.[0];
    if (file) setZhLines(parseSrt(await file.text()));
  };

  const doExport = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'subtitlelingo-progress.json' });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      replaceAll(importState(await file.text()));
      flash('進度已匯入。');
    } catch (err) {
      flash(err.message);
    }
    e.target.value = '';
  };

  const stepInfo = STEPS[step - 1];
  const done = movie.completedSteps.includes(step);
  const showEnglish = step === 3 || step === 4;
  const myVocab = state.vocab.filter((v) => v.movieId === movieId);

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 text-left [&_button]:bg-slate-700 [&_button]:text-slate-100 [&_button:disabled]:opacity-40">
      <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/" className="text-sm text-amber-300">← 回首頁</Link>
            <h1 className="!text-3xl font-bold" data-testid="learn-title">
              {info?.title || (loadError ? '無法載入影片資料' : '載入中…')}
            </h1>
            {loadError && <p className="text-amber-300 text-sm">{loadError}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button type="button" onClick={doExport}>⬇ 匯出進度檔</button>
            <label className="cursor-pointer rounded-lg border border-slate-600 px-3 py-2">
              ⬆ 匯入進度檔
              <input type="file" accept="application/json,.json" onChange={doImport} className="hidden" />
            </label>
          </div>
        </header>

        <StepBar current={step} completed={movie.completedSteps} recommended={recommendedStep(movie)} onSelect={setStep} />

        <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-amber-300">步驟 {step}：{stepInfo.title}</h2>
              <p className="text-slate-300 text-sm">{stepInfo.hint}</p>
            </div>
            <button
              type="button"
              data-testid="complete-step"
              onClick={() => updateThisMovie((m) => toggleStep(m, step))}
              className={done ? '!bg-emerald-700 text-white' : '!bg-amber-500 text-slate-900 font-bold'}
            >
              {done ? '✅ 已完成（點一下取消）' : '完成這一步'}
            </button>
          </div>
        </section>

        {/* 影片來源 */}
        <section className="grid gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold">
              <input type="radio" name="source" checked={sourceType === 'youtube'} onChange={() => setSourceType('youtube')} />
              YouTube 嵌入播放
            </label>
            <div className="flex gap-2">
              <input
                aria-label="YouTube 網址"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="貼上 YouTube 影片網址"
                className="flex-1 rounded bg-slate-900 px-2 py-1 text-slate-100"
              />
              <button type="button" onClick={saveUrl} data-testid="save-youtube">使用</button>
            </div>
            {urlError && <p role="alert" className="text-amber-300 text-sm">{urlError}</p>}
            <p className="text-xs text-slate-400">影片從 YouTube 播放，網站不下載影片。可能有廣告；部分影片禁止嵌入。</p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold">
              <input type="radio" name="source" checked={sourceType === 'local'} onChange={() => setSourceType('local')} />
              自己電腦裡的影片檔
            </label>
            <input type="file" accept="video/*,audio/*" onChange={pickLocal} data-testid="local-file" className="text-sm" />
            <p className="text-xs text-slate-400">
              {localFile ? `目前檔案：${localFile.name}。` : ''}檔案只在你的瀏覽器播放，不會上傳。關閉頁面後需要重新選取。
            </p>
          </div>
        </section>

        {/* 播放器和字幕 */}
        <section className="space-y-3">
          {source ? (
            <>
              <VideoPlayer ref={player} source={source} key={source.type + (source.videoId || source.url)} />
              <div className="min-h-12 rounded-lg bg-black/60 px-4 py-2 text-center text-lg" data-testid="subtitle-overlay">
                {step === 2 && (zhIndex >= 0 ? zhLines[zhIndex].text : '')}
                {showEnglish && currentIndex >= 0 && (step === 3
                  ? <ClickableText text={lines[currentIndex].text} onWord={onWord} savedWords={savedWords} />
                  : lines[currentIndex].text)}
                {(step === 1 || step === 5) && <span className="text-sm text-slate-500">（這一步不顯示字幕）</span>}
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-600 p-6 text-center text-slate-300" data-testid="no-source">
              請先選擇影片來源。沒有影片時，步驟 4、5 的「播放」會改用電腦朗讀（不是演員原聲，只適合練發音）。
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>播放速度</span>
            {RATES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRate(r)}
                data-testid={`rate-${r}`}
                className={`!px-2 !py-1 ${r === rate ? '!bg-amber-500 text-slate-900' : ''}`}
              >
                {r} 倍
              </button>
            ))}
            {lines.length > 0 && (
              <>
                <span className="ml-4">字幕時間微調 {offset > 0 ? '+' : ''}{offset.toFixed(1)} 秒</span>
                <button type="button" className="!px-2 !py-1" onClick={() => updateThisMovie((m) => ({ ...m, subtitleOffset: +((m.subtitleOffset || 0) - 0.5).toFixed(1) }))}>字幕提早 0.5 秒</button>
                <button type="button" className="!px-2 !py-1" onClick={() => updateThisMovie((m) => ({ ...m, subtitleOffset: +((m.subtitleOffset || 0) + 0.5).toFixed(1) }))}>字幕延後 0.5 秒</button>
              </>
            )}
          </div>
          {notice && <p role="status" className="text-emerald-300 text-sm">{notice}</p>}
        </section>

        {/* 各步驟的工具 */}
        {step === 2 && (
          <section className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-2">
            <label className="block font-bold">載入自己的中文字幕檔（.srt）</label>
            <input type="file" accept=".srt,text/plain" onChange={pickZh} className="text-sm" />
            <p className="text-xs text-slate-400">
              {zhLines.length ? `已載入 ${zhLines.length} 句中文字幕。` : '沒有中文字幕檔時，可以在 Netflix 等平台看完，再回來按「完成這一步」。'}
            </p>
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <h3 className="mb-2 font-bold">英文字幕（點字加入生字本）</h3>
              {lines.length
                ? <LinePanel lines={lines} currentIndex={currentIndex} movie={movie} mode="vocab" onWord={onWord} savedWords={savedWords} />
                : <p className="text-slate-400">這部片沒有英文字幕資料。</p>}
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4" data-testid="my-vocab">
              <h3 className="mb-2 font-bold">我的生字本（{myVocab.length}）</h3>
              {myVocab.length === 0 ? <p className="text-slate-400 text-sm">尚無資料</p> : (
                <ul className="space-y-2 text-sm list-none m-0 p-0">
                  {myVocab.map((v) => (
                    <li key={v.word} className="rounded bg-slate-900 p-2">
                      <div className="flex justify-between">
                        <strong className="text-amber-300">{v.word}</strong>
                        <button type="button" className="!px-2 !py-0" aria-label={`刪除 ${v.word}`} onClick={() => updateAll((s) => removeVocab(s, v.word, movieId))}>✕</button>
                      </div>
                      <p className="text-slate-300">{v.sentence}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {(step === 4 || step === 5) && (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
              {step === 5 && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-900 p-3">
                  <span className="text-2xl font-bold text-amber-300" data-testid="full-rounds">第 {movie.fullRounds} / 100 遍</span>
                  <button type="button" onClick={() => updateThisMovie(addFullRound)} data-testid="add-round" className="!bg-amber-500 text-slate-900 font-bold">
                    整部片跟說完一輪 +1
                  </button>
                </div>
              )}
              <h3 className="font-bold">A-B 重複段落</h3>
              <SegmentPanel
                segments={movie.segments}
                activeId={range?.segmentId}
                getTime={() => player.current?.getTime() ?? 0}
                onAdd={(seg) => updateThisMovie((m) => addSegment(m, seg))}
                onUpdate={(id, changes) => updateThisMovie((m) => updateSegment(m, id, changes))}
                onRemove={(id) => { if (range?.segmentId === id) setRange(null); updateThisMovie((m) => removeSegment(m, id)); }}
                onPlay={(seg) => playRange(seg.start, seg.end, { loop: true, segmentId: seg.id })}
                onStop={() => { setRange(null); player.current?.pause(); }}
                onRep={(id) => updateThisMovie((m) => addSegmentRep(m, id))}
                showReps
              />
              <h3 className="font-bold">錄音對照</h3>
              <Recorder onPlayOriginal={lastRange ? () => playRange(lastRange.start, lastRange.end, lastRange) : null} />
              <p className="text-xs text-slate-400">先播放一句或一段，再錄自己的聲音比較。錄音不存檔、不上傳。</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <h3 className="mb-2 font-bold">逐句練習{step === 5 ? '（字幕已隱藏）' : ''}</h3>
              {lines.length
                ? (
                  <LinePanel
                    lines={lines}
                    currentIndex={currentIndex}
                    playingIndex={range?.lineIndex}
                    movie={movie}
                    mode={step === 5 ? 'speak' : 'practice'}
                    onPlayLine={playLine}
                    onPassed={(i, v) => updateThisMovie((m) => setLinePassed(m, i, v))}
                    onRep={(i) => updateThisMovie((m) => addLineRep(m, i))}
                  />
                )
                : <p className="text-slate-400">這部片沒有字幕檔，請用左邊的 A-B 重複練習。</p>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
