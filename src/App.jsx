import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import './utils/dbTest.js'; // 測試 Turso 連線
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import StatsPage from './pages/StatsPage';

function App() {
  return (
    <Router basename="/subtitlelingo">
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice/:movieId" element={<PracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
