import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './screens/SplashScreen';
import LandingScreen from './screens/LandingScreen';
import MenuScreen from './screens/MenuScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import CartScreen from './screens/CartScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import EntertainmentScreen from './screens/EntertainmentScreen';
import QuizGameScreen from './screens/QuizGameScreen';
import BottomTabBar from './navigation/BottomTabBar';

/**
 * BREW LUNA — Main Application Shell
 * Phase 3: Menu & Product Detail Integration
 */

const Placeholder = ({ name }) => (
  <div style={{ padding: '80px 20px', textAlign: 'center', height: '100vh', background: 'var(--bg-page)' }}>
    <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px', color: 'var(--color-mocha)' }}>{name}</h1>
    <p style={{ color: 'var(--text-muted)' }}>This feature is brewing in the next phase.</p>
  </div>
);

function App() {
  return (
    <Router>
      <div id="root">
        <Routes>
          {/* Public / Init Entry */}
          <Route path="/" element={<SplashScreen />} />

          {/* Main App Screens */}
          <Route path="/home" element={<LandingScreen />} />
          <Route path="/menu" element={<MenuScreen />} />
          <Route path="/product/:id" element={<ProductDetailScreen />} />

          <Route path="/cart" element={<CartScreen />} />
          <Route path="/orders" element={<OrderTrackingScreen />} />
          <Route path="/fun" element={<EntertainmentScreen />} />
          <Route path="/fun/quiz" element={<QuizGameScreen />} />
          <Route path="/news" element={<Placeholder name="Latest News" />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Navigation bar persistent */}
        <BottomTabBar />
      </div>
    </Router>
  );
}

export default App;
