import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./index.css"
import Login from "./components/Login";
import Register from "./components/Register";
import TaskDashboard from "./components/TaskDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

// Create a new RoleRoute component for role-based access
const RoleRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Create a component to handle initial routing
const InitialRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Regular user dashboard */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute>
                <TaskDashboard />
              </RoleRoute>
            }
          />

          {/* Admin dashboard - only accessible by admins */}
          <Route
            path="/admin"
            element={
              <RoleRoute requiredRole="admin">
                <AdminDashboard />
              </RoleRoute>
            }
          />

          {/* Initial route that redirects based on role */}
          <Route path="/" element={<InitialRoute />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;