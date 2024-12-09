import { Navigate, Outlet } from "react-router-dom";

const UserProtectedRoutes = () => {
  const isLoggedInUser = true; // TODO: get the user info from redux
  return isLoggedInUser ? <Outlet /> : <Navigate to='/login' replace />;
};
export default UserProtectedRoutes;
