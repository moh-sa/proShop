import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedRoutes = () => {
  const isAdmin = true; // TODO: get the user info from redux
  return isAdmin ? <Outlet /> : <Navigate to='/login' replace />;
};
export default AdminProtectedRoutes;
