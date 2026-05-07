import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { type SubmitEvent } from "react";

export function SearchBar() {
	const navigate = useNavigate();

	// TODO: 'useSearch' + from :/search
	// search params are: keyword/query and page/pageNumber
	// and validate the search params on the route.
	// wire the 'keyword' to the input field

	function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		// const formData = new FormData(e.currentTarget);
		// const search = formData.get("search")?.toString().trim();

		// TODO: navigate to /search?query=search
		navigate({ to: "/" });
	}

	return (
		<form className="rounded-full bg-muted px-4" onSubmit={handleSubmit}>
			<InputGroup className="border-none">
				<InputGroupAddon align="inline-start">
					<SearchIcon className="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="Search..." name="search" />
			</InputGroup>
		</form>
	);
}
