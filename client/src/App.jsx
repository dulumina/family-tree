import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import AppPage from './pages/AppPage';
import { ToastContainer } from './components/UI/Toast';

export default function App() {
  const { user } = useAuth();
  return (
    <>
      {user ? <AppPage /> : <AuthPage />}
      <ToastContainer />
    </>
  );
}
