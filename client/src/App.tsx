import "./App.css";
import { useEffect, useState } from "react";
import { ModulesService } from "./api/modules.service";
import type { Module } from "../../shared/types/modules.types";

function App() {
	const [modules, setModules] = useState<Module[]>([]);

	useEffect(() => {
		ModulesService.getAll().then(setModules);
	}, []);

	return (
		<ul>
			{modules.map((m) => (
				<li key={m.id}>{m.name}</li>
			))}
		</ul>
	);
}

export default App;
