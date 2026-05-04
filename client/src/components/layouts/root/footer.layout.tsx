import { Logo } from "@/components/branding";

export function Footer() {
	return (
		<footer className="border-t bg-background">
			<div className="container mx-auto flex flex-row items-center justify-between px-4 py-4 text-muted-foreground sm:px-6">
				<Logo className="text-lg hover:text-foreground" />
				<div className="inline-flex items-center gap-1">
					<span>Built by </span>
					<a
						className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
						href="https://github.com/moh-sa/proshop"
						target="_blank"
					>
						<img
							src="https://github.com/moh-sa.png"
							alt="my github avatar"
							className="size-4 rounded-full"
						/>
						<span>Moh-sa</span>
					</a>
				</div>
			</div>
		</footer>
	);
}
