import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  CircularProgress,
} from '@mui/material';
import { GroupsService } from '@api/groups.service';
import { ModulesService } from '@api/modules.service';
import type { Module as ModuleType } from '@shared/types/modules.types';
import './Module.css';

const Module: React.FC = () => {
  const [seminarGroups, setSeminarGroups] = useState<string[]>([]);
  const [selectedSeminarGroup, setSelectedSeminarGroup] = useState<string>('');
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [selectedModuleCode, setSelectedModuleCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [attendedModules, setAttendedModules] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Module";
    GroupsService.get()
      .then(setSeminarGroups)
      .catch((err) => {
        console.error('Failed to fetch groups:', err);
        setError('Fehler beim Laden der Seminargruppen.');
      });
  }, []);

  useEffect(() => {
    if (!selectedSeminarGroup) {
      setModules([]);
      setSelectedModuleCode('');
      return;
    }
    setIsLoading(true);
    setError(null);
    ModulesService.get(selectedSeminarGroup)
      .then(setModules)
      .catch((err) => {
        console.error('Failed to fetch modules:', err);
        setError('Module konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedSeminarGroup]);


  const handleAttendedModulesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value === '' ? '' : Number(event.target.value);
    if (value === '' || (Number.isInteger(value) && value >= 0)) {
      setAttendedModules(value);
    }
  };

  const selectedModule = modules.find(m => m.code === selectedModuleCode);

  return (
    <Container className="module-page">
      <Typography variant="h4" gutterBottom>
        Module
      </Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="seminar-group-select-label">Seminargruppe</InputLabel>
        <Select
          labelId="seminar-group-select-label"
          value={selectedSeminarGroup}
          label="Seminargruppe"
          onChange={(e) => setSelectedSeminarGroup(e.target.value as string)}
        >
          {seminarGroups.map((group) => (
            <MenuItem key={group} value={group}>
              {group}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isLoading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      {modules.length > 0 && !isLoading && (
        <>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="module-select-label">Modul auswählen</InputLabel>
            <Select
              labelId="module-select-label"
              id="module-select"
              value={selectedModuleCode}
              label="Modul auswählen"
              onChange={(e) => {
                setSelectedModuleCode(e.target.value as string);
                setSelectedGroup('');
              }}
            >
              {modules.map((module) => (
                <MenuItem key={module.code} value={module.code}>
                  {module.name} ({module.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedModule && selectedModule.groups && selectedModule.groups.length > 0 && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="group-select-label">Gruppe auswählen</InputLabel>
              <Select
                labelId="group-select-label"
                id="group-select"
                value={selectedGroup}
                label="Gruppe auswählen"
                onChange={(e) => setSelectedGroup(e.target.value as string)}
              >
                {selectedModule.groups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Meine Module</Typography>
            {/* This section will later display the user's modules. */}
            <Typography variant="body2" color="text.secondary">
              (Anzeige der Module des Benutzers ist noch nicht implementiert)
            </Typography>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Anzahl besuchter Module"
              type="number"
              value={attendedModules}
              onChange={handleAttendedModulesChange}
              inputProps={{ min: '0', step: '1' }}
            />
            <Typography variant="body1">
              / (Gesamtzahl der Module noch nicht implementiert)
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Anwesenheit</Typography>
            <Typography variant="body1">
              (Anwesenheit in Prozent noch nicht implementiert)
            </Typography>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Module;
