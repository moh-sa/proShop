import { CatchBoundary, Link } from "@tanstack/react-router";

// TODO: replace with a proper error page
export function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <CatchBoundary
      // TODO: Add a unique key to the reset key
      getResetKey={() => "error-boundary"}
    >
      <div>{error.message}</div>
      <Link to="/">Go to Home</Link>
      <button onClick={reset}>Reset</button>
    </CatchBoundary>
  );
}
