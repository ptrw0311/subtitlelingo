import { useState } from 'react';
import RecentMoviesCard from './RecentMoviesCard';

export default function MovieSelector({ currentMovieId, onMovieSelect }) {
  return (
    <div className="mb-2">
      {/* 電影選擇區塊 */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {/* 標題列 */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-white">
              選擇影片學習
            </h2>
            <div className="text-xs text-white opacity-90">
              {currentMovieId ? (
                <span>正在學習：<span className="font-semibold">已選擇影片</span></span>
              ) : (
                <span>請選擇一部影片開始學習</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3">
          {/* 最近練習的電影 */}
          <RecentMoviesCard
            currentMovieId={currentMovieId}
            onMovieSelect={onMovieSelect}
          />
        </div>
      </div>
    </div>
  );
}
