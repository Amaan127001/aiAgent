import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b26] flex items-center justify-center">
        <div className="text-[#00d8ff] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;