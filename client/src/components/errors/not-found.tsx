import { Link } from "@tanstack/react-router";

// TODO: replace with a proper not found page
export function NotFoundPage() {
  return (
    <div>
      <h1>Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Go to Home</Link>
    </div>
  );
}
