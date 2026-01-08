import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import './utils/dbTest.js'; // 測試 Turso 連線
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import StatsPage from './pages/StatsPage';
import QuizPage from './pages/QuizPage';

// Vercel 和本地開發都使用根路徑（無 basename）
const basename = '';

function App() {
  return (
    <Router basename={basename}>
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
