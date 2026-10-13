import { useState } from 'react';
import { formatSeconds } from '../../utils/srt';

// A-B 重複：按 A 記開始點、按 B 記結束點，存成段落清單反覆練（YouTube、本機影片都可用）
export default function SegmentPanel({
  segments, activeId, getTime, onAdd, onUpdate, onRemove, onPlay, onStop, onRep, showReps,
}) {
  const [pointA, setPointA] = useState(null);
  const [error, setError] = useState('');

  const markA = () => { setPointA(getTime()); setError(''); };
  const markB = () => {
    try {
      onAdd({ start: pointA, end: getTime() });
      setPointA(null);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const nudge = (seg, field, delta) => {
    const value = Math.max(0, +(seg[field] + delta).toFixed(2));
    if (field === 'start' ? value < seg.end : value > seg.start) onUpdate(seg.id, { [field]: value });
  };

  return (
    <section className="space-y-3" data-testid="segment-panel">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={markA} data-testid="mark-a">🅰 記下開始點</button>
        <button type="button" onClick={markB} disabled={pointA === null} data-testid="mark-b">🅱 記下結束點</button>
        <span className="text-sm text-slate-300">
          {pointA === null ? '播放時按 A 記下開始點，再按 B 記下結束點。' : `開始點 ${formatSeconds(pointA)}，請在句尾按 B。`}
        </span>
      </div>
      {error && <p role="alert" className="text-amber-300 text-sm">{error}</p>}

      {segments.length === 0
        ? <p className="text-slate-400 text-sm">還沒有段落。</p>
        : (
          <ul className="space-y-2 list-none m-0 p-0">
            {segments.map((seg) => (
              <li
                key={seg.id}
                data-testid="segment"
                className={`rounded-lg border p-3 ${seg.id === activeId ? 'border-amber-400 bg-slate-700' : 'border-slate-600 bg-slate-800'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    aria-label="段落名稱"
                    value={seg.name}
                    onChange={(e) => onUpdate(seg.id, { name: e.target.value })}
                    className="bg-slate-900 text-slate-100 rounded px-2 py-1 w-32"
                  />
                  <span className="text-sm text-slate-300 font-mono" data-testid="segment-range">
                    {formatSeconds(seg.start)}–{formatSeconds(seg.end)}
                  </span>
                  {seg.id === activeId
                    ? <button type="button" onClick={onStop}>⏸ 停止重複</button>
                    : <button type="button" onClick={() => onPlay(seg)} data-testid="segment-play">🔁 重複播放</button>}
                  <button type="button" onClick={() => onRemove(seg.id)} aria-label="刪除段落">🗑</button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                  <span className="text-slate-400">開始點</span>
                  <button type="button" className="!px-2 !py-0.5" onClick={() => nudge(seg, 'start', -0.5)}>−0.5 秒</button>
                  <button type="button" className="!px-2 !py-0.5" onClick={() => nudge(seg, 'start', 0.5)}>+0.5 秒</button>
                  <span className="ml-2 text-slate-400">結束點</span>
                  <button type="button" className="!px-2 !py-0.5" onClick={() => nudge(seg, 'end', -0.5)}>−0.5 秒</button>
                  <button type="button" className="!px-2 !py-0.5" onClick={() => nudge(seg, 'end', 0.5)}>+0.5 秒</button>
                  <label className="ml-2 flex items-center gap-1 text-slate-200">
                    <input type="checkbox" checked={seg.passed} onChange={(e) => onUpdate(seg.id, { passed: e.target.checked })} />
                    跟上了
                  </label>
                  {showReps && (
                    <>
                      <span className="ml-2 text-amber-300 font-bold" data-testid="segment-reps">{seg.reps} / 100</span>
                      <button type="button" className="!px-2 !py-0.5" onClick={() => onRep(seg.id)}>+1</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
