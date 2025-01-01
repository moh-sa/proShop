import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedRoutes = () => {
  const userState = useSelector((state) => state.auth.user);
  if (!userState || !userState.isAdmin) return <Navigate to='/login' replace />;

  return <Outlet />;
};
export default AdminProtectedRoutes;
