import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
	Box,
	Checkbox,
	CircularProgress,
	FormControl,
	Grid,
	InputLabel,
	Link,
	List,
	ListItem,
	MenuItem,
	Paper,
	Select,
	Typography
} from '@mui/material';
import { ModulesService } from '@api/modules.service';
import { GroupsService } from '@api/groups.service';
import type { Module } from '@shared/types/modules.types';

// --- Helper Functions ---
const getModuleIgnoreKey = (moduleName: string) => moduleName;
const getGroupIgnoreKey = (moduleName: string, groupName: string) => `${moduleName}|${groupName}`;

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
	onToggleGroup: (moduleName: string, groupName: string) => void;
}) {
	const { checked, indeterminate } = useMemo(() => {
		const hasGroups = module.groups && module.groups.length > 0;
		if (hasGroups) {
			const groupKeys = module.groups!.map(g => getGroupIgnoreKey(module.name, g));
			const ignoredCount = groupKeys.filter(k => ignored.has(k)).length;
			const allGroupsIgnored = ignoredCount === groupKeys.length;
			const noGroupsIgnored = ignoredCount === 0;

			return {
				checked: noGroupsIgnored,
				indeterminate: !allGroupsIgnored && !noGroupsIgnored,
			};
		} else {
			return {
				checked: !ignored.has(getModuleIgnoreKey(module.name)),
				indeterminate: false,
			};
		}
	}, [module, ignored]);

	return (
		<Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
			<Box sx={{ display: 'flex', alignItems: 'center' }}>
				<Checkbox
					checked={checked}
					indeterminate={indeterminate}
					onChange={() => onToggleModule(module)}
				/>
				<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{module.name}</Typography>
			</Box>
			{module.groups && module.groups.length > 0 && (
				<List dense disablePadding sx={{ pl: 2 }}>
					{module.groups.map(group => (
						<ListItem key={group} disablePadding>
							<Checkbox
								size="small"
								checked={!ignored.has(getGroupIgnoreKey(module.name, group))}
								onChange={() => onToggleGroup(module.name, group)}
							/>
							<Typography variant="body2">{group}</Typography>
						</ListItem>
					))}
				</List>
			)}
		</Paper>
	);
});

export function Modules() {
	// --- State ---
	const [seminarGroups, setSeminarGroups] = useState<string[]>([]);
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [modules, setModules] = useState<Module[]>([]);
	const [ignored, setIgnored] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

	// --- Data Fetching ---
	useEffect(() => {
		GroupsService.get()
			.then(setSeminarGroups)
			.catch(err => {
				console.error("Failed to fetch groups", err);
				setError("Failed to load seminar groups.");
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
				setError('Unable to load modules. Please try again later.');
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [selectedGroup]);

	// --- Ticking Logic ---
	const handleToggleGroup = useCallback((moduleName: string, groupName: string) => {
		const key = getGroupIgnoreKey(moduleName, groupName);
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
				const groupKeys = module.groups!.map(g => getGroupIgnoreKey(module.name, g));
				const allGroupsIgnored = groupKeys.every(k => newIgnored.has(k));
				if (allGroupsIgnored) {
					groupKeys.forEach(k => newIgnored.delete(k));
				} else {
					groupKeys.forEach(k => newIgnored.add(k));
				}
			} else {
				const key = getModuleIgnoreKey(module.name);
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

		const finalIgnoredParams = [];
		for (const module of modules) {
			const hasGroups = module.groups && module.groups.length > 0;
			if (hasGroups) {
				const groupKeys = module.groups!.map(g => getGroupIgnoreKey(module.name, g));
				const allGroupsIgnored = groupKeys.every(k => ignored.has(k));

				if (allGroupsIgnored) {
					finalIgnoredParams.push(getModuleIgnoreKey(module.name));
				} else {
					for (const key of groupKeys) {
						if (ignored.has(key)) {
							finalIgnoredParams.push(key);
						}
					}
				}
			} else {
				const key = getModuleIgnoreKey(module.name);
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
			<Typography variant="h4" gutterBottom>Modules</Typography>
			<FormControl fullWidth sx={{ mb: 2 }}>
				<InputLabel id="seminar-group-select-label">Seminar Group</InputLabel>
				<Select
					labelId="seminar-group-select-label"
					value={selectedGroup}
					label="Seminar Group"
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
					<Typography gutterBottom>Untick modules or groups to ignore them in the generated timetable.</Typography>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
							gap: 2,
						}}
					>
						{modules.map(module => (
							<ModuleCard
								key={module.name}
								module={module}
								ignored={ignored}
								onToggleModule={handleToggleModule}
								onToggleGroup={handleToggleGroup}
							/>
						))}
					</Box>
					{generatedUrl && (
						<Box sx={{ mt: 3 }}>
							<Typography variant="h6">Generated URL:</Typography>
							<Link href={generatedUrl} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: 'break-all' }}>{generatedUrl}</Link>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}

export default Modules;
