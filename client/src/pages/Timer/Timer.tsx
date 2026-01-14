import { useEffect, useState, useMemo } from "react";
import { Container, Typography, Card, CardContent, CircularProgress, Box, Tooltip, useTheme } from "@mui/material";
import "./Timer.css";
import type { Block } from "@shared/types/Block";
import { TimerService } from "@api/timer.service";

// Helper to format seconds into HH:MM:SS
const formatTimeRemaining = (seconds: number) => {
  if (seconds < 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const Timer = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const theme = useTheme();

  useEffect(() => {
    document.title = "Timer";
    TimerService.get()
      .then((data) => {
        // Sort blocks by start time
        const sorted = [...data].sort((a, b) => a.start - b.start);
        setBlocks(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch blocks:", err);
        setError("Fehler beim Laden der Daten.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { segments, currentStatus, progressPercent, dayStart, dayEnd, timeLeftWithBreaks, timeLeftWithoutBreaks } = useMemo(() => {
    if (blocks.length === 0) return { segments: [], currentStatus: null, progressPercent: 0, dayStart: 0, dayEnd: 0, timeLeftWithBreaks: 0, timeLeftWithoutBreaks: 0 };

    // Assume 90 min duration if end is missing.
    const getEnd = (b: Block) => (b as any).end || (b.start + 90 * 60);

    const start = blocks[0].start;
    const end = getEnd(blocks[blocks.length - 1]);
    const totalDuration = end - start;
    const currentSec = Math.floor(now.getTime() / 1000);

    const segs: { type: 'block' | 'pause'; start: number; end: number; data?: Block }[] = [];
    let lastEnd = start;
    let timeLeftWithoutBreaks = 0;

    blocks.forEach(block => {
      const bStart = block.start;
      const bEnd = getEnd(block);

      if (bStart > lastEnd) {
        segs.push({ type: 'pause', start: lastEnd, end: bStart });
      }
      segs.push({ type: 'block', start: bStart, end: bEnd, data: block });
      lastEnd = bEnd;

      if (currentSec < bStart) {
        timeLeftWithoutBreaks += (bEnd - bStart);
      } else if (currentSec < bEnd) {
        timeLeftWithoutBreaks += (bEnd - currentSec);
      }
    });

    const timeLeftWithBreaks = Math.max(0, end - currentSec);

    let status = null;
    if (currentSec < start) {
        status = { state: 'before', next: blocks[0], remaining: start - currentSec };
    } else if (currentSec > end) {
        status = { state: 'after', remaining: 0 };
    } else {
        const currentSeg = segs.find(s => currentSec >= s.start && currentSec < s.end);
        if (currentSeg) {
            if (currentSeg.type === 'block') {
                status = { state: 'block', block: currentSeg.data, remaining: currentSeg.end - currentSec };
            } else {
                const nextBlock = blocks.find(b => b.start >= currentSeg.end);
                status = { state: 'pause', next: nextBlock, remaining: currentSeg.end - currentSec };
            }
        }
    }

    const pPercent = Math.min(100, Math.max(0, ((currentSec - start) / totalDuration) * 100));

    return { segments: segs, currentStatus: status, progressPercent: pPercent, dayStart: start, dayEnd: end, timeLeftWithBreaks, timeLeftWithoutBreaks };
  }, [blocks, now]);

  return (
    <Container className="timer-page" maxWidth="md">
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
          {now.toLocaleTimeString('de-DE')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
            {now.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
      {error && <Typography color="error" align="center">{error}</Typography>}

      {!isLoading && !error && blocks.length === 0 && (
        <Typography align="center">Keine Einträge für heute gefunden.</Typography>
      )}

      {!isLoading && !error && blocks.length > 0 && (
        <>
            {/* Current Status Card */}
            <Card variant="elevation" elevation={3} sx={{ mb: 4, bgcolor: currentStatus?.state === 'pause' ? 'action.hover' : 'background.paper' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                    {currentStatus?.state === 'before' && (
                        <>
                            <Typography variant="h5">Der Tag beginnt bald</Typography>
                            <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
                                - {formatTimeRemaining(currentStatus.remaining)}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Erster Block: {currentStatus.next?.description || "Unbenannt"}
                            </Typography>
                        </>
                    )}
                    {currentStatus?.state === 'block' && currentStatus.block && (
                        <>
                            <Typography variant="overline" sx={{ fontSize: '1rem', color: 'success.main' }}>
                                Läuft gerade
                            </Typography>
                            <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                                {currentStatus.block.description || "Unbenannt"}
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                                {currentStatus.block.room} {currentStatus.block.instructor ? `• ${currentStatus.block.instructor}` : ''}
                            </Typography>
                            <Typography variant="h3" sx={{ mt: 3, fontFamily: 'monospace' }}>
                                {formatTimeRemaining(currentStatus.remaining)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">verbleibend</Typography>
                        </>
                    )}
                    {currentStatus?.state === 'pause' && (
                        <>
                            <Typography variant="h5" color="text.secondary">Pause</Typography>
                            <Typography variant="h3" sx={{ mt: 2, fontFamily: 'monospace' }}>
                                {formatTimeRemaining(currentStatus.remaining)}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Nächster Block: {currentStatus.next?.description || "Unbenannt"} ({new Date((currentStatus.next?.start || 0) * 1000).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})})
                            </Typography>
                        </>
                    )}
                    {currentStatus?.state === 'after' && (
                        <Typography variant="h5">Feierabend! 🎉</Typography>
                    )}
                </CardContent>
            </Card>

            {/* Total Timers */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Card variant="outlined" sx={{ flex: 1 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">Restzeit (mit Pausen)</Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontFamily: 'monospace', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                            {formatTimeRemaining(timeLeftWithBreaks)}
                        </Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">Restzeit (ohne Pausen)</Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontFamily: 'monospace', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                            {formatTimeRemaining(timeLeftWithoutBreaks)}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Day Progress Bar */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">{new Date(dayStart * 1000).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}</Typography>
                    <Typography variant="caption">Tagesfortschritt</Typography>
                    <Typography variant="caption">{new Date(dayEnd * 1000).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}</Typography>
                </Box>
                <Box sx={{ height: 24, width: '100%', bgcolor: 'grey.800', borderRadius: 4, overflow: 'hidden', display: 'flex', position: 'relative', border: '1px solid', borderColor: 'grey.700' }}>
                    {segments.map((seg, i) => {
                        const duration = seg.end - seg.start;
                        const total = dayEnd - dayStart;
                        const width = (duration / total) * 100;
                        return (
                            <Tooltip key={i} title={`${seg.type === 'block' ? (seg.data?.description || 'Block') : 'Pause'} (${new Date(seg.start * 1000).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})} - ${new Date(seg.end * 1000).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})})`}>
                                <Box sx={{ width: `${width}%`, bgcolor: seg.type === 'block' ? 'primary.dark' : 'transparent', borderRight: i < segments.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', opacity: 0.8, '&:hover': { opacity: 1, bgcolor: seg.type === 'block' ? 'primary.main' : 'grey.700' }, transition: 'all 0.2s' }} />
                            </Tooltip>
                        );
                    })}
                    <Box sx={{ position: 'absolute', left: `${progressPercent}%`, top: 0, bottom: 0, width: 2, bgcolor: 'error.main', zIndex: 2, boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
                </Box>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Tagesübersicht</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {blocks.map((block, index) => {
                    const isPast = (block as any).end ? ((block as any).end < now.getTime()/1000) : (block.start + 90*60 < now.getTime()/1000);
                    const isCurrent = currentStatus?.state === 'block' && currentStatus.block === block;
                    return (
                        <Card key={`${block.start}-${index}`} variant={isCurrent ? "elevation" : "outlined"} elevation={isCurrent ? 4 : 1} sx={{ opacity: isPast ? 0.6 : 1, borderLeft: isCurrent ? `6px solid ${theme.palette.primary.main}` : undefined, bgcolor: isCurrent ? 'action.selected' : undefined }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{block.description || "Unbenannt"}</Typography>
                                    <Typography variant="body2" color="text.secondary">{block.room} {block.instructor && `• ${block.instructor}`}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{new Date(block.start * 1000).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}</Typography>
                                    <Typography variant="caption" color="text.secondary">bis {new Date(((block as any).end || block.start + 90*60) * 1000).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </>
      )}
    </Container>
  );
};
