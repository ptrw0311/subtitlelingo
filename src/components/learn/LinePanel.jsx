import { formatSeconds } from '../../utils/srt';

// 把一句台詞拆成可點選的字；點字會連同原句加入我的生字本
export function ClickableText({ text, onWord, savedWords }) {
  return text.split(/(\s+)/).map((token, i) => {
    const word = token.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, '');
    if (!word) return <span key={i}>{token}</span>;
    const saved = savedWords?.has(word);
    return (
      <span
        key={i}
        role="button"
        tabIndex={0}
        data-word={word}
        title="加入我的生字本"
        onClick={() => onWord(token, text)}
        onKeyDown={(e) => { if (e.key === 'Enter') onWord(token, text); }}
        className={`cursor-pointer rounded hover:bg-amber-400/30 ${saved ? 'underline decoration-amber-400' : ''}`}
      >
        {token}
      </span>
    );
  });
}

// 逐句清單：播放單句、重播、跟上了、跟說次數
export default function LinePanel({
  lines, currentIndex, playingIndex, movie, mode, onPlayLine, onPassed, onRep, onWord, savedWords,
}) {
  const hideText = mode === 'speak';
  const clickable = mode === 'vocab';

  return (
    <ol className="max-h-96 overflow-y-auto space-y-1 pr-1 list-none m-0 pl-0" data-testid="line-panel">
      {lines.map((line) => {
        const reps = movie.lineReps[line.index] || 0;
        const passed = !!movie.linePassed[line.index];
        const highlight = line.index === currentIndex || line.index === playingIndex;
        return (
          <li
            key={line.index}
            data-testid="line"
            data-index={line.index}
            className={`flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 ${highlight ? 'bg-slate-700 ring-1 ring-amber-400' : 'bg-slate-800/60'}`}
          >
            <span className="w-24 shrink-0 font-mono text-xs text-slate-400">
              {line.index + 1}. {formatSeconds(line.start)}
            </span>
            <span className="flex-1 min-w-48 text-slate-100">
              {hideText
                ? <span className="text-slate-500">（字幕已隱藏）</span>
                : clickable
                  ? <ClickableText text={line.text} onWord={onWord} savedWords={savedWords} />
                  : line.text}
            </span>
            {mode !== 'vocab' && (
              <span className="flex items-center gap-1 text-xs">
                <button type="button" className="!px-2 !py-0.5" onClick={() => onPlayLine(line)} data-testid="play-line">
                  {line.index === playingIndex ? '🔂 重播' : '▶ 播放'}
                </button>
                <label className="flex items-center gap-1 text-slate-200">
                  <input type="checkbox" checked={passed} onChange={(e) => onPassed(line.index, e.target.checked)} />
                  跟上了
                </label>
                <span className="text-amber-300 font-bold" data-testid="line-reps">{reps} / 100</span>
                <button type="button" className="!px-2 !py-0.5" onClick={() => onRep(line.index)} data-testid="line-rep">+1</button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
