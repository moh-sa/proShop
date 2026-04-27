import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import QueryProvider from "./providers/query.provider";

createRoot(document.getElementById("root")!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>,
);
