import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import { green, red, blue } from "@mui/material/colors";
import { GroupsService } from "@api/groups.service";
import { ModulesService } from "@api/modules.service";
import type { Module as ModuleType } from "@shared/types/Module";
import type { Block } from "@shared/types/Block";
import "./Anwesenheit.css";

const Anwesenheit: React.FC = () => {
  const [seminarGroups, setSeminarGroups] = useState<string[]>([]);
  const [selectedSeminarGroup, setSelectedSeminarGroup] = useState<string>("");
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [selectedModuleCode, setSelectedModuleCode] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [attendedModules, setAttendedModules] = useState<number>(0);
  const [absentModules, setAbsentModules] = useState<number>(0);
  const [futureModules, setFutureModules] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [totalModules, setTotalModules] = useState<number>(0);
  const [attendance, setAttendance] = useState<number>(0);
  const [blockStatuses, setBlockStatuses] = useState<
    Record<string, "present" | "absent" | "future">
  >({});

  useEffect(() => {
    document.title = "Anwesenheit";
    GroupsService.get()
      .then(setSeminarGroups)
      .catch((err) => {
        console.error("Failed to fetch groups:", err);
        setError("Fehler beim Laden der Seminargruppen.");
      });
  }, []);

  useEffect(() => {
    if (!selectedSeminarGroup) {
      setModules([]);
      setSelectedModuleCode("");
      return;
    }
    setIsLoading(true);
    setError(null);
    setBlocks([]);
    ModulesService.get(selectedSeminarGroup)
      .then(setModules)
      .catch((err) => {
        console.error("Failed to fetch modules:", err);
        setError(
          "Module konnten nicht geladen werden. Bitte versuchen Sie es später erneut."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedSeminarGroup]);

  useEffect(() => {
    if (attendedModules >= 0 && totalModules > 0) {
      setAttendance((attendedModules / totalModules) * 100);
    } else {
      setAttendance(0);
    }
  }, [attendedModules, totalModules]);

  useEffect(() => {
    const values = Object.values(blockStatuses);
    const attendedCount = values.filter(
      (status) => status === "present"
    ).length;
    const absentCount = values.filter((status) => status === "absent").length;
    const futureCount = values.filter((status) => status === "future").length;
    setAttendedModules(attendedCount);
    setAbsentModules(absentCount);
    setFutureModules(futureCount);
  }, [blockStatuses]);

  const selectedModule = modules.find((m) => m.code === selectedModuleCode);

  const getBlockKey = useCallback(
    (block: Block) => {
      return `attendance-${selectedSeminarGroup}-${selectedModuleCode}-${selectedGroup}-${block.start}`;
    },
    [selectedSeminarGroup, selectedModuleCode, selectedGroup]
  );

  useEffect(() => {
    if (blocks.length > 0) {
      const now = Date.now();
      const newStatuses: Record<string, "present" | "absent" | "future"> = {};

      for (const block of blocks) {
        const key = getBlockKey(block);
        const storedStatus = localStorage.getItem(key) as
          | "present"
          | "absent"
          | null;

        if (block.start * 1000 > now) {
          // Future
          newStatuses[key] = "future";
        } else {
          // Past
          newStatuses[key] = storedStatus === "absent" ? "absent" : "present";
        }
      }
      setBlockStatuses(newStatuses);
    } else {
      setBlockStatuses({});
    }
  }, [blocks, getBlockKey]);

  useEffect(() => {
    const hasGroups =
      selectedModule &&
      selectedModule.groups &&
      selectedModule.groups.length > 0;
    if (selectedModuleCode && (!hasGroups || (hasGroups && selectedGroup))) {
      setIsLoading(true);
      setError(null);
      ModulesService.getInfo(
        selectedSeminarGroup,
        selectedModuleCode,
        selectedGroup
      )
        .then((data) => {
          setBlocks(data);
          setTotalModules(data.length);
        })
        .catch((err) => {
          console.error("Failed to fetch module info:", err);
          setError("Modul-Informationen konnten nicht geladen werden.");
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
  }, [
    selectedModuleCode,
    selectedGroup,
    selectedSeminarGroup,
    modules,
    selectedModule,
  ]);

  const handleBlockClick = useCallback(
    (block: Block) => {
      const isFuture = block.start * 1000 > Date.now();
      if (isFuture) {
        return;
      }

      const key = getBlockKey(block);
      setBlockStatuses((prevStatuses) => {
        const currentStatus = prevStatuses[key];
        let newStatus = currentStatus;

        if (currentStatus === "present") {
          newStatus = "absent";
        } else if (currentStatus === "absent") {
          newStatus = "present";
        }

        if (newStatus !== currentStatus) {
          localStorage.setItem(key, newStatus);
          return { ...prevStatuses, [key]: newStatus };
        }
        return prevStatuses;
      });
    },
    [getBlockKey]
  );

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
                setSelectedGroup("");
              }}
            >
              {modules.map((module) => (
                <MenuItem key={module.code} value={module.code}>
                  {module.name} ({module.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedModule &&
            selectedModule.groups &&
            selectedModule.groups.length > 0 && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="group-select-label">
                  Gruppe auswählen
                </InputLabel>
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
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Besucht
                  </Typography>
                  <Typography variant="h4" sx={{ color: green[800] }}>
                    {attendedModules}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Versäumt
                  </Typography>
                  <Typography variant="h4" sx={{ color: red[800] }}>
                    {absentModules}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Ausstehend
                  </Typography>
                  <Typography variant="h4" sx={{ color: blue[800] }}>
                    {futureModules}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Gesamt
                  </Typography>
                  <Typography variant="h4">{totalModules}</Typography>
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Quote
                  </Typography>
                  <Typography variant="h4">{attendance.toFixed(2)}%</Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Meine Module</Typography>
            {blocks.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 2,
                  mt: 2,
                }}
              >
                {blocks.map((block) => (
                  <Card
                    key={`${block.start}-${block.title}`}
                    variant="outlined"
                    onClick={() => handleBlockClick(block)}
                    sx={{
                      cursor:
                        block.start * 1000 > Date.now() ? "default" : "pointer",
                      backgroundColor:
                        blockStatuses[getBlockKey(block)] === "present"
                          ? green[800]
                          : blockStatuses[getBlockKey(block)] === "absent"
                          ? red[800]
                          : blue[800],
                      color: "white",
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" component="div">
                        {block.description}
                      </Typography>
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        {new Date(block.start * 1000).toLocaleString("de-DE", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </Typography>
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        {block.instructor}
                      </Typography>
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        {block.room}
                      </Typography>
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
