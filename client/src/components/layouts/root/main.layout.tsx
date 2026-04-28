import { Outlet } from "@tanstack/react-router";

export function Main() {
  return (
    <main id="main-content">
      <div className="container mx-auto h-full px-4 py-4 sm:px-6 sm:py-6">
        <Outlet />
      </div>
    </main>
  );
}
