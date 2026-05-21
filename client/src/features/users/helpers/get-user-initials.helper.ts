export function getUserInitials(userName?: string) {
	return userName
		? userName
				.split(" ")
				.map((name) => name[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "??";
}
