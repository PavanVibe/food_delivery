import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/contexts";
import Loader from "./Loader";

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default ProtectedRoute;
