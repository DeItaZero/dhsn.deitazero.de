export async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
	const res = await fetch(input, {
		headers: { "Content-Type": "application/json" },
		...init,
	});

	if (!res.ok) {
		throw new Error(await res.text());
	}

	return res.json() as Promise<T>;
}
