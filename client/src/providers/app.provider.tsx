import QueryProvider from "./query.provider";

/** Wraps the app in all client-state providers. */
export function AppProvider({ children }: { children: React.ReactNode }) {
	return <QueryProvider>{children}</QueryProvider>;
}
