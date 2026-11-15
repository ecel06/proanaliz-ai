// src/services/horseRacingService.ts
import { HorseRacingBulletinResponse, ProgramDetail } from '../types/horseRacing';

export async function fetchHorseRacingBulletin(
  programId?: number | null,
  force = false
): Promise<HorseRacingBulletinResponse> {
  const params = new URLSearchParams();
  if (programId) params.set('programId', String(programId));
  if (force) params.set('force', '1');
  const qs = params.toString();
  const res = await fetch(`/api/horse-racing/bulletin${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error(`At yarışı bülteni yüklenemedi (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchHorseRacingProgram(
  programId: number,
  force = false
): Promise<ProgramDetail> {
  const res = await fetch(
    `/api/horse-racing/program/${programId}${force ? '?force=1' : ''}`
  );
  if (!res.ok) {
    throw new Error(`Hipodrom programı alınamadı (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (!data?.detail) {
    throw new Error('Program detayı boş döndü');
  }
  return data.detail;
}

export async function fetchLiveRaceStream(): Promise<{ videoId: string; embedUrl: string }> {
  try {
    const res = await fetch('/api/horse-racing/live-stream');
    if (!res.ok) throw new Error('Live stream endpoint failed');
    const data = await res.json();
    return data;
  } catch {
    return {
      videoId: 'Lq4RbOueIL0',
      embedUrl: 'https://www.youtube.com/embed/Lq4RbOueIL0?autoplay=1&mute=0&rel=0',
    };
  }
}

