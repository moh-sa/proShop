import { Footer } from "./footer.layout";
import { Header } from "./header.layout";
import { Main } from "./main.layout";

export function RootLayout() {
	return (
		<div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
			<Header />
			<Main />
			<Footer />
		</div>
	);
}
