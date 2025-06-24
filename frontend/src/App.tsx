import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PlaybackProvider } from './contexts/PlaybackContext';
import DashboardComponent from './components/Dashboard';

function App() {
  return (
    <PlaybackProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/" 
              element={<DashboardComponent />}
            />
            <Route 
              path="/dashboard" 
              element={<Dashboard onLogout={() => {}} />}
            />
            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
        </div>
      </Router>
    </PlaybackProvider>
  );
}

export default App;