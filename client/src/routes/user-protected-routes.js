import UserProtectedRoutes from "../Components/user-protected.layout";
import OrderScreen from "../Screens/OrderScreen";
import PaymentScreen from "../Screens/PaymentScreen";
import PlaceOrderScreen from "../Screens/PlaceOrderScreen";
import ProfileScreen from "../Screens/ProfileScreen";
import ShippingScreen from "../Screens/ShippingScreen";

const userProtectedRoutes = {
  element: <UserProtectedRoutes />,
  children: [
    {
      path: "shipping",
      element: <ShippingScreen />,
    },
    {
      path: "payment",
      element: <PaymentScreen />,
    },
    {
      path: "placeOrder",
      element: <PlaceOrderScreen />,
    },
    {
      path: "order/:id",
      element: <OrderScreen />,
    },
    {
      path: "profile",
      element: <ProfileScreen />,
    },
  ],
};

export default userProtectedRoutes;
