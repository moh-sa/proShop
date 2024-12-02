import { createBrowserRouter } from "react-router-dom";
import RootRouteLayout from "../Components/root.layout";
import HomeScreen from "../Screens/HomeScreen";
import adminProtectedRoutes from "./admin-protected-routes";
import publicRoutes from "./public-routes";
import userProtectedRoutes from "./user-protected-routes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRouteLayout />,
    children: [
      {
        index: true,
        element: <HomeScreen />,
      },
      // Public Routes
      ...publicRoutes,
      // protected routes for logged in USER
      userProtectedRoutes,
      // protected routes for ADMIN
      adminProtectedRoutes,
    ],
  },
]);
