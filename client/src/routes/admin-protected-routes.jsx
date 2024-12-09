import AdminProtectedRoutes from "../Components/admin-protected.layout";
import HomeScreen from "../Screens/HomeScreen";
import OrderListScreen from "../Screens/OrderListScreen";
import ProductEditScreen from "../Screens/ProductEditScreen";
import ProductListScreen from "../Screens/ProductListScreen";
import UserEditScreen from "../Screens/UserEditScreen";
import UsersListScreen from "../Screens/UsersListScreen";

const adminProtectedRoutes = {
  path: "/admin",
  element: <AdminProtectedRoutes />,
  children: [
    {
      index: true,
      element: <HomeScreen />,
    },
    {
      path: "orderList",
      element: <OrderListScreen />,
    },
    {
      path: "product/:id/edit",
      element: <ProductEditScreen />,
    },
    {
      path: "user/:id/edit",
      element: <UserEditScreen />,
    },
    {
      path: "userList",
      element: <UsersListScreen />,
    },
    {
      path: "productList",
      element: <ProductListScreen />,
    },
    {
      path: "productList/:pageNumber",
      element: <ProductListScreen />,
    },
  ],
};

export default adminProtectedRoutes;
