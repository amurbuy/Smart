// ──────────────────────────────────────────────────────────
//  SmartLivestock – API Client
// ──────────────────────────────────────────────────────────

import type {
  Livestock, LivestockDTO, StatsDTO,
  RegisterRequest, LoginRequest, AuthResponse,
  AnimalGroup, AnimalGroupDTO,
  Notification,
} from '@/types';

const BASE   = 'http://localhost:8080/api/livestock';
const AUTH   = 'http://localhost:8080/api/auth';
const GROUPS = 'http://localhost:8080/api/groups';
const NOTIF  = 'http://localhost:8080/api/notifications';

export function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('sl_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── AUTH ─────────────────────────────────────────────────
export async function registerUser(body: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${AUTH}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function loginUser(body: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${AUTH}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

// ── LIVESTOCK ────────────────────────────────────────────
export async function fetchAllLivestock(): Promise<Livestock[]> {
  const res = await fetch(BASE, { cache: 'no-store', headers: authHeader() });
  return handleResponse<Livestock[]>(res);
}

export async function fetchStats(): Promise<StatsDTO> {
  const res = await fetch(`${BASE}/stats`, { cache: 'no-store', headers: authHeader() });
  return handleResponse<StatsDTO>(res);
}

export async function fetchLivestockById(id: number): Promise<Livestock> {
  const res = await fetch(`${BASE}/${id}`, { headers: authHeader() });
  return handleResponse<Livestock>(res);
}

export async function createLivestock(dto: LivestockDTO): Promise<Livestock> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(dto),
  });
  return handleResponse<Livestock>(res);
}

export async function updateLivestock(id: number, dto: LivestockDTO): Promise<Livestock> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(dto),
  });
  return handleResponse<Livestock>(res);
}

export async function confirmDraft(id: number, dto: Partial<LivestockDTO>): Promise<Livestock> {
  const res = await fetch(`${BASE}/${id}/confirm`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(dto),
  });
  return handleResponse<Livestock>(res);
}

export async function deleteLivestock(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  return handleResponse<void>(res);
}

// ── GROUPS ───────────────────────────────────────────────
export async function fetchAllGroups(): Promise<AnimalGroup[]> {
  const res = await fetch(GROUPS, { cache: 'no-store', headers: authHeader() });
  return handleResponse(res);
}

export async function createGroup(dto: AnimalGroupDTO): Promise<AnimalGroup> {
  const res = await fetch(GROUPS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(dto),
  });
  return handleResponse(res);
}

export async function updateGroup(id: number, dto: AnimalGroupDTO): Promise<AnimalGroup> {
  const res = await fetch(`${GROUPS}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(dto),
  });
  return handleResponse(res);
}

export async function deleteGroup(id: number): Promise<void> {
  const res = await fetch(`${GROUPS}/${id}`, { method: 'DELETE', headers: authHeader() });
  return handleResponse(res);
}

// ── NOTIFICATIONS ────────────────────────────────────────
export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch(NOTIF, { cache: 'no-store', headers: authHeader() });
  return handleResponse(res);
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${NOTIF}/unread-count`, { cache: 'no-store', headers: authHeader() });
  const data = await handleResponse<{ count: number }>(res);
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await fetch(`${NOTIF}/${id}/read`, { method: 'PATCH', headers: authHeader() });
  return handleResponse(res);
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${NOTIF}/read-all`, { method: 'PATCH', headers: authHeader() });
  return handleResponse(res);
}

export async function triggerBirthCheck(): Promise<void> {
  const res = await fetch(`${NOTIF}/trigger-births`, {
    method: 'POST',
    headers: authHeader(),
  });
  return handleResponse(res);
}
