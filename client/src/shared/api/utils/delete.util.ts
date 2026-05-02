import { api } from "@/lib";
import { ClientApiError, normalizeError } from "../error";

export async function del(url: string): Promise<void> {
	try {
		await api.delete(url);
	} catch (error) {
		throw new ClientApiError(normalizeError(error));
	}
}
