import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const UserProtectedRoutes = () => {
  const userState = useSelector((state) => state.auth.user);
  if (!userState) return <Navigate to='/login' replace />;

  return <Outlet />;
};
export default UserProtectedRoutes;
