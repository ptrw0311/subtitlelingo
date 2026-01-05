import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import './utils/dbTest.js'; // 測試 Turso 連線
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import StatsPage from './pages/StatsPage';
import QuizPage from './pages/QuizPage';

function App() {
  return (
    <Router basename="/subtitlelingo">
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice/:movieId" element={<PracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/quiz" element={<QuizPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
