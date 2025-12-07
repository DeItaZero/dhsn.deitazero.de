import './Modules.css'
import { useEffect, useState } from "react";
import { GroupsService } from "@api/groups.service";

export function Modules() {
	const [seminarGroupIds, setSeminarGroupIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		setIsLoading(true);
		setError(null);

		GroupsService.get()
			.then((data) => {
				setSeminarGroupIds(data);
			})
			.catch((err) => {
				console.error("Failed to fetch groups:", err);

				setError("Unable to load seminar groups. Please try again later.");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	if (isLoading) return <p>Loading...</p>;
	if (error) return <p className="error-message">{error}</p>;

	return (
		<ul>
			{seminarGroupIds.map((m, i) => (
				<li key={m + i}>{m}</li>
			))}
		</ul>
	);
}

export default Modules;
