// 五步驟進度條：標示已完成和建議的下一步，但可以直接點任何一步（Q4：不強制順序）
import { STEPS } from './steps';

export default function StepBar({ current, completed, recommended, onSelect }) {
  return (
    <ol className="grid grid-cols-5 gap-2 list-none m-0 p-0" aria-label="五步驟進度">
      {STEPS.map(({ step, title }) => {
        const done = completed.includes(step);
        const active = step === current;
        return (
          <li key={step}>
            <button
              type="button"
              onClick={() => onSelect(step)}
              aria-current={active ? 'step' : undefined}
              data-testid={`step-${step}`}
              data-done={done}
              className={`w-full h-full !p-2 text-left text-sm !rounded-lg border ${
                active ? '!border-amber-400 !bg-slate-700' : '!border-slate-600 !bg-slate-800'
              }`}
            >
              <span className="block font-bold text-amber-300">
                {done ? '✅' : step === recommended ? '👉' : '⬜'} 步驟 {step}
              </span>
              <span className="block text-slate-200">{title}</span>
              {step === recommended && !done && <span className="block text-xs text-amber-200">建議下一步</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
