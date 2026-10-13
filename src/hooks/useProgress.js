import { useCallback, useState } from 'react';
import { loadState, saveState, getMovie, updateMovie } from '../utils/progress-store';

// 讀寫某部片的學習進度；每次更新都立即存回 localStorage
export default function useProgress(movieId) {
  const [state, setState] = useState(() => loadState());

  const commit = useCallback((next) => {
    saveState(undefined, next);
    setState(next);
  }, []);

  // updater 接收這部片的進度，回傳更新後的進度
  const updateThisMovie = useCallback(
    (updater) => setState((prev) => {
      const next = updateMovie(prev, movieId, updater);
      saveState(undefined, next);
      return next;
    }),
    [movieId],
  );

  // updater 接收整份狀態（例如生字本），回傳更新後的狀態
  const updateAll = useCallback(
    (updater) => setState((prev) => {
      const next = updater(prev);
      saveState(undefined, next);
      return next;
    }),
    [],
  );

  return { state, movie: getMovie(state, movieId), updateThisMovie, updateAll, replaceAll: commit };
}
