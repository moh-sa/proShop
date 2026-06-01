import { useState } from "react";

export function useDisclosure(initial = false) {
	const [isOpen, setIsOpen] = useState(initial);

	return {
		isOpen,
		setIsOpen,
		onOpen: () => setIsOpen(true),
		onClose: () => setIsOpen(false),
	};
}
