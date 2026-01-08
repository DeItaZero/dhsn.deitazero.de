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
  Card,
  CardContent,
} from '@mui/material';
import { GroupsService } from '@api/groups.service';
import { ModulesService } from '@api/modules.service';
import type { Module as ModuleType } from '@shared/types/Module';
import type { Block } from '@shared/types/Block';
import './Anwesenheit.css';

const Anwesenheit: React.FC = () => {
  const [seminarGroups, setSeminarGroups] = useState<string[]>([]);
  const [selectedSeminarGroup, setSelectedSeminarGroup] = useState<string>('');
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [selectedModuleCode, setSelectedModuleCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [attendedModules, setAttendedModules] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [totalModules, setTotalModules] = useState<number>(0);
  const [attendance, setAttendance] = useState<number>(0);

  useEffect(() => {
    document.title = "Anwesenheit";
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
    setBlocks([]);
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

  useEffect(() => {
    if (attendedModules !== '' && totalModules > 0) {
      setAttendance((attendedModules / totalModules) * 100);
    } else {
      setAttendance(0);
    }
  }, [attendedModules, totalModules]);

  const selectedModule = modules.find(m => m.code === selectedModuleCode);

  useEffect(() => {
    const hasGroups = selectedModule && selectedModule.groups && selectedModule.groups.length > 0;
    if (selectedModuleCode && (!hasGroups || (hasGroups && selectedGroup))) {
      setIsLoading(true);
      setError(null);
      ModulesService.getInfo(selectedSeminarGroup, selectedModuleCode, selectedGroup)
        .then((data) => {
          setBlocks(data);
          setTotalModules(data.length);
        })
        .catch((err) => {
          console.error('Failed to fetch module info:', err);
          setError('Modul-Informationen konnten nicht geladen werden.');
          setBlocks([]);
          setTotalModules(0);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setBlocks([]);
      setTotalModules(0);
    }
  }, [selectedModuleCode, selectedGroup, selectedSeminarGroup, modules, selectedModule]);

  const handleAttendedModulesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value === '' ? '' : Number(event.target.value);
    if (value === '' || (Number.isInteger(value) && value >= 0)) {
      setAttendedModules(value);
    }
  };

  return (
    <Container className="anwesenheit-page">
      <Typography variant="h4" gutterBottom>
        Anwesenheit
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

          {blocks.length > 0 && (
            <>
              <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Anzahl besuchter Module"
                  type="number"
                  value={attendedModules}
                  onChange={handleAttendedModulesChange}
                  inputProps={{ min: '0', step: '1' }}
                />
                <Typography variant="body1">/ {totalModules}</Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Anwesenheit</Typography>
                <Typography variant="body1">
                  {attendance.toFixed(2)} %
                </Typography>
              </Box>
            </>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Meine Module</Typography>
            {blocks.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, mt: 2 }}>
                {blocks.map((block) => (
                  <Card key={`${block.start}-${block.title}`} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" component="div">{block.description}</Typography>
                      <Typography color="text.secondary">{new Date(block.start * 1000).toLocaleString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</Typography>
                      <Typography color="text.secondary">{block.instructor}</Typography>
                      <Typography color="text.secondary">{block.room}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                (Keine Module für diese Auswahl gefunden)
              </Typography>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default Anwesenheit;
