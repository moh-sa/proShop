import SearchRouteLayout from "../Components/search.layout";
import CartScreen from "../Screens/CartScreen";
import HomeScreen from "../Screens/HomeScreen";
import LoginScreen from "../Screens/LoginScreen";
import ProductScreen from "../Screens/ProductScreen";
import RegisterScreen from "../Screens/RegisterScreen";

const searchRoutes = [
  {
    index: true,
    element: <HomeScreen />,
  },
  {
    path: ":keyword",
    element: <HomeScreen />,
  },
  {
    path: ":keyword/:pageNumber",
    element: <HomeScreen />,
  },
];

const publicRoutes = [
  {
    path: "page/:pageNumber",
    element: <HomeScreen />,
  },
  {
    path: "search",
    element: <SearchRouteLayout />,
    children: [...searchRoutes],
  },
  {
    path: "product/:id",
    element: <ProductScreen />,
  },
  {
    path: "cart/:id?",
    element: <CartScreen />,
  },
  {
    path: "login",
    element: <LoginScreen />,
  },
  {
    path: "register",
    element: <RegisterScreen />,
  },
];

export default publicRoutes;
