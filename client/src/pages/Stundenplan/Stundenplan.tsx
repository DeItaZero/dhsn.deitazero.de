import React, { useEffect, useState, useCallback } from 'react';
import {
	Box,
	Card,
	CardContent,
	Checkbox,
	CircularProgress,
	FormControl,
	InputLabel,
	Link,
	MenuItem,
	Select,
	Typography
} from '@mui/material';
import { ModulesService } from '@api/modules.service';
import { GroupsService } from '@api/groups.service';
import type { Module } from '@shared/types/modules.types';

// --- Helper Functions ---
const getModuleIgnoreKey = (moduleCode: string) => moduleCode;
const getGroupIgnoreKey = (moduleCode: string, groupName: string) => `${moduleCode}|${groupName}`;

// --- Memoized Row Component ---
const ModuleCard = React.memo(function ModuleCard({
	module,
	ignored,
	onToggleModule,
	onToggleGroup,
}: {
	module: Module;
	ignored: Set<string>;
	onToggleModule: (module: Module) => void;
	onToggleGroup: (moduleCode: string, groupName: string) => void;
}) {
	const hasGroups = module.groups && module.groups.length > 0;

	// This is for the single checkbox when there are no groups
	const isModuleIgnored = ignored.has(getModuleIgnoreKey(module.code));

	return (
		<Card variant="outlined" sx={{
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			minHeight: 120,
			bgcolor: 'background.paper'
		}}>
			<CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
				<Box>
					<Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
						{module.code}
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
						{module.name}
					</Typography>
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					{hasGroups ? (
						<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 2 }}>
							{module.groups!.map(group => (
								<Box key={group} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
									<Checkbox
										checked={!ignored.has(getGroupIgnoreKey(module.code, group))}
										onChange={() => onToggleGroup(module.code, group)}
									/>
									<Typography variant="caption">{group}</Typography>
								</Box>
							))}
						</Box>
					) : (
						<Checkbox
							checked={!isModuleIgnored}
							onChange={() => onToggleModule(module)}
						/>
					)}
				</Box>
			</CardContent>
		</Card>
	);
});

export function Stundenplan() {
	// --- State ---
	const [seminarGroups, setSeminarGroups] = useState<string[]>([]);
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [modules, setModules] = useState<Module[]>([]);
	const [ignored, setIgnored] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    useEffect(() => {
        document.title = "Stundenplan";
    }, []);

	// --- Data Fetching ---
	useEffect(() => {
		GroupsService.get()
			.then(setSeminarGroups)
			.catch(err => {
				console.error("Failed to fetch groups", err);
				setError("Fehler beim Laden der Seminargruppen.");
			});
	}, []);

	useEffect(() => {
		if (!selectedGroup) {
			setModules([]);
			return;
		}
		setIsLoading(true);
		setError(null);
		setIgnored(new Set());
		ModulesService.get(selectedGroup)
			.then(setModules)
			.catch((err) => {
				console.error('Failed to fetch modules:', err);
				setError('Module konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [selectedGroup]);

	// --- Ticking Logic ---
	const handleToggleGroup = useCallback((moduleCode: string, groupName: string) => {
		const key = getGroupIgnoreKey(moduleCode, groupName);
		setIgnored(prev => {
			const newIgnored = new Set(prev);
			if (newIgnored.has(key)) {
				newIgnored.delete(key);
			} else {
				newIgnored.add(key);
			}
			return newIgnored;
		});
	}, []);

	const handleToggleModule = useCallback((module: Module) => {
		setIgnored(prev => {
			const newIgnored = new Set(prev);
			const hasGroups = module.groups && module.groups.length > 0;
			if (hasGroups) {
				// This part of the logic is not triggered by the UI for modules with groups anymore,
				// but we keep it correct for completeness.
				const groupKeys = module.groups!.map(g => getGroupIgnoreKey(module.code, g));
				const allGroupsIgnored = groupKeys.every(k => newIgnored.has(k));
				if (allGroupsIgnored) {
					groupKeys.forEach(k => newIgnored.delete(k));
				} else {
					groupKeys.forEach(k => newIgnored.add(k));
				}
			} else {
				const key = getModuleIgnoreKey(module.code);
				if (newIgnored.has(key)) {
					newIgnored.delete(key);
				} else {
					newIgnored.add(key);
				}
			}
			return newIgnored;
		});
	}, []);

	// --- URL Generation ---
	useEffect(() => {
		if (!selectedGroup) {
			setGeneratedUrl(null);
			return;
		}

		const finalIgnoredParams: string[] = [];
		for (const module of modules) {
			const hasGroups = module.groups && module.groups.length > 0;
			if (hasGroups) {
				const groupKeys = module.groups!.map(g => getGroupIgnoreKey(module.code, g));
				const ignoredGroupCount = groupKeys.filter(k => ignored.has(k)).length;

				if (ignoredGroupCount === groupKeys.length) {
					finalIgnoredParams.push(getModuleIgnoreKey(module.code));
				} else {
					for (const key of groupKeys) {
						if (ignored.has(key)) {
							finalIgnoredParams.push(key);
						}
					}
				}
			} else {
				const key = getModuleIgnoreKey(module.code);
				if (ignored.has(key)) {
					finalIgnoredParams.push(key);
				}
			}
		}

		const ignoredQueryString = finalIgnoredParams.join(',');
		const url = `/api/timetable?seminarGroupId=${selectedGroup}${ignoredQueryString ? `&ignore=${ignoredQueryString}` : ''}`;
		setGeneratedUrl(url);
	}, [ignored, selectedGroup, modules]);

	// --- Render ---
	return (
		<Box sx={{ p: 2 }}>
			<Typography variant="h4" gutterBottom>Stundenplan</Typography>
			<FormControl fullWidth sx={{ mb: 2 }}>
				<InputLabel id="seminar-group-select-label">Seminargruppe</InputLabel>
				<Select
					labelId="seminar-group-select-label"
					value={selectedGroup}
					label="Seminargruppe"
					onChange={(e) => setSelectedGroup(e.target.value as string)}
				>
					{seminarGroups.map(group => (
						<MenuItem key={group} value={group}>{group}</MenuItem>
					))}
				</Select>
			</FormControl>
			{isLoading && <CircularProgress />}
			{error && <Typography color="error">{error}</Typography>}
			{modules.length > 0 && !isLoading && (
				<>
					<Typography gutterBottom>Module oder Gruppen abwählen, um sie im generierten Stundenplan zu ignorieren.</Typography>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
							gap: 2,
						}}
					>
						{modules.map(module => (
							<ModuleCard
								key={module.code}
								module={module}
								ignored={ignored}
								onToggleModule={handleToggleModule}
								onToggleGroup={handleToggleGroup}
							/>
						))}
					</Box>
					{generatedUrl && (
						<Box sx={{ mt: 3 }}>
							<Typography variant="h6">Generierte URL:</Typography>
							<Link href={generatedUrl} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: 'break-all' }}>{generatedUrl}</Link>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}

export default Stundenplan;
