import { Toaster } from "@/components/ui/sonner";

/** Wraps the app in all client-state providers. */
export function AppProvider({ children }: { children: React.ReactNode }) {
	return (
		<>
			{children}
			<Toaster />
		</>
	);
}
