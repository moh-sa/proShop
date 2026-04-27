import { RouterProvider } from "@tanstack/react-router";
import { initSentry } from "./instrument";
import getRouter from "./router";

const router = getRouter();
initSentry(router);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
