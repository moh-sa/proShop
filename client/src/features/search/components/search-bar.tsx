import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { type SubmitEvent } from "react";

// why no 'useState' you ask?
// why re-render the component on every keystroke
// if we won't use the 'controlled' value for suggestions or auto-completion?
export function SearchBar() {
	const navigate = useNavigate();
	const location = useLocation();

	const isSearchRoute = location.pathname === "/search";
	const urlKeyword = location.search?.keyword ?? "";

	function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const search = formData.get("search")?.toString().trim();

		navigate({ to: "/search", search: { keyword: search } });
	}

	return (
		<form className="rounded-full bg-muted px-4" onSubmit={handleSubmit}>
			<InputGroup className="border-none">
				<InputGroupAddon align="inline-start">
					<SearchIcon className="size-4" />
				</InputGroupAddon>
				<InputGroupInput
					name="search"
					placeholder="Search..."
					defaultValue={isSearchRoute ? urlKeyword : ""}
					// key is used to reset the input field when the route changes
					key={isSearchRoute ? urlKeyword : ""}
				/>
			</InputGroup>
		</form>
	);
}
