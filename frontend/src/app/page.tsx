'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Livestock, LivestockDTO, StatsDTO, SortField, SortDir } from '@/types';
import {
  fetchAllLivestock, fetchStats,
  createLivestock, updateLivestock, deleteLivestock,
  confirmDraft, fetchUnreadCount,
} from '@/api';

// ── Helpers ──────────────────────────────────────────────
const speciesIcon = (s: string) =>
  s === 'Cow' ? '🐄' : s === 'Sheep' ? '🐑' : s === 'Goat' ? '🐐' : s === 'Horse' ? '🐎' : '🐷';

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Icons ────────────────────────────────────────────────
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const SortDnIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/>
  </svg>
);
const SortUpIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);

// ── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    ACTIVE:     'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    SOLD:       'bg-amber-900/40  text-amber-400  border-amber-800',
    DECEASED:   'bg-rose-900/40   text-rose-400   border-rose-800',
    QUARANTINE: 'bg-violet-900/40 text-violet-400 border-violet-800',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono border ${m[status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
      {status}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────
function StatCard({ label, value, accent, emoji, small }: {
  label: string; value: number | string; accent: string; emoji: string; small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#2a3029] bg-[#161a17] p-5 flex flex-col gap-1.5 relative overflow-hidden">
      <div className="absolute -right-2 -top-2 text-4xl opacity-10 select-none">{emoji}</div>
      <p className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">{label}</p>
      <p className={`font-display ${small ? 'text-3xl' : 'text-4xl'} ${accent}`}>{value}</p>
    </div>
  );
}

// ── Empty form ────────────────────────────────────────────
const emptyForm = (): LivestockDTO => ({
  species: 'Cow', tagNumber: '', gender: 'Female',
  birthDate: null, pregnancyDate: null, status: 'ACTIVE', isDraft: false,
});

// ── Add / Edit Modal ──────────────────────────────────────
function AnimalModal({ open, onClose, onSubmit, editTarget, loading, error }: {
  open: boolean; onClose: () => void;
  onSubmit: (dto: LivestockDTO) => Promise<void>;
  editTarget: Livestock | null; loading: boolean; error: string | null;
}) {
  const [form, setForm] = useState<LivestockDTO>(emptyForm());

  useEffect(() => {
    if (editTarget) {
      setForm({
        species: editTarget.species, tagNumber: editTarget.tagNumber,
        gender: editTarget.gender, birthDate: editTarget.birthDate,
        pregnancyDate: editTarget.pregnancyDate, status: editTarget.status,
        isDraft: editTarget.isDraft,
      });
    } else { setForm(emptyForm()); }
  }, [editTarget, open]);

  if (!open) return null;

  const isMale = form.gender === 'Male';
  const ic = "bg-[#1e2520] border border-[#2a3029] rounded-lg px-3 py-2 text-sm text-[#e8ead6] focus:outline-none focus:border-[#6dba7d] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#161a17] border border-[#2a3029] rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2a3029]">
          <h2 className="font-display text-xl text-[#e8ead6]">{editTarget ? 'Edit Animal' : 'Add New Animal'}</h2>
          <button onClick={onClose} className="text-[#7a8c79] hover:text-[#e8ead6] text-xl leading-none">✕</button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); await onSubmit(form); }} className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Species</span>
              <select className={ic} value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))}>
                <option>Cow</option><option>Sheep</option><option>Goat</option><option>Horse</option><option>Pig</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Tag Number</span>
              <input required className={ic} value={form.tagNumber} placeholder="e.g. TAG-001"
                onChange={e => setForm(f => ({ ...f, tagNumber: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Gender</span>
              <select className={ic} value={form.gender}
                onChange={e => {
                  const g = e.target.value as 'Male' | 'Female';
                  setForm(f => ({ ...f, gender: g, pregnancyDate: g === 'Male' ? null : f.pregnancyDate }));
                }}>
                <option>Female</option><option>Male</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Status</span>
              <select className={ic} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="ACTIVE">Active</option><option value="SOLD">Sold</option>
                <option value="DECEASED">Deceased</option><option value="QUARANTINE">Quarantine</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Birth Date</span>
              <input type="date" className={ic} value={form.birthDate ?? ''}
                onChange={e => setForm(f => ({ ...f, birthDate: e.target.value || null }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Pregnancy Date</span>
              <input type="date"
                className={`${ic} ${isMale ? 'opacity-30 cursor-not-allowed' : ''}`}
                value={isMale ? '' : (form.pregnancyDate ?? '')}
                disabled={isMale}
                onChange={e => setForm(f => ({ ...f, pregnancyDate: e.target.value || null }))} />
              {isMale && <span className="text-xs text-[#d4a84b]">⚠ Males cannot be pregnant</span>}
            </label>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.isDraft}
                onChange={e => setForm(f => ({ ...f, isDraft: e.target.checked }))} />
              <div className={`w-10 h-5 rounded-full transition-colors ${form.isDraft ? 'bg-[#6dba7d]' : 'bg-[#2a3029]'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.isDraft ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm text-[#7a8c79]">Save as Draft (offspring)</span>
          </label>

          {error && <p className="text-xs text-rose-400 bg-rose-900/20 border border-rose-900 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#2a3029] text-sm text-[#7a8c79] hover:text-[#e8ead6] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#6dba7d] text-[#0f1210] text-sm font-semibold hover:bg-[#7dca8d] transition-colors disabled:opacity-50">
              {loading ? 'Saving…' : editTarget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Draft Modal ───────────────────────────────────
function ConfirmDraftModal({ animal, onClose, onConfirm, loading, error }: {
  animal: Livestock | null; onClose: () => void;
  onConfirm: (id: number, dto: Partial<LivestockDTO>) => Promise<void>;
  loading: boolean; error: string | null;
}) {
  const [tag,    setTag]    = useState('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [birth,  setBirth]  = useState('');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    if (animal) {
      setTag(animal.tagNumber);
      setGender((animal.gender as any) ?? 'Female');
      setBirth(animal.birthDate ?? '');
      setStatus(animal.status ?? 'ACTIVE');
    }
  }, [animal]);

  if (!animal) return null;

  const ic = "bg-[#1e2520] border border-[#2a3029] rounded-lg px-3 py-2 text-sm text-[#e8ead6] focus:outline-none focus:border-[#6dba7d] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#161a17] border border-[#6dba7d]/40 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2a3029]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐣</span>
              <h2 className="font-display text-xl text-[#e8ead6]">Confirm Offspring</h2>
            </div>
            <p className="text-xs text-[#7a8c79] mt-0.5 font-mono">
              {animal.parentId ? `Parent animal ID: #${animal.parentId}` : 'Draft offspring'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#7a8c79] hover:text-[#e8ead6] text-xl leading-none">✕</button>
        </div>

        <div className="mx-6 mt-5 bg-[#6dba7d]/10 border border-[#6dba7d]/30 rounded-lg px-4 py-3 text-sm text-[#6dba7d]">
          This draft was automatically created when the expected birth date arrived.
          Please verify the details and confirm.
        </div>

        <form onSubmit={async e => {
          e.preventDefault();
          await onConfirm(animal.id, {
            tagNumber: tag,
            gender: gender,
            birthDate: birth || null,
            status: status as any,
          });
        }} className="px-6 py-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Tag Number</span>
            <input required className={ic} value={tag} onChange={e => setTag(e.target.value)}
              placeholder="Assign permanent tag" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Gender</span>
              <select className={ic} value={gender} onChange={e => setGender(e.target.value as any)}>
                <option>Female</option><option>Male</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Status</span>
              <select className={ic} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="ACTIVE">Active</option><option value="SOLD">Sold</option>
                <option value="DECEASED">Deceased</option><option value="QUARANTINE">Quarantine</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-mono text-[#7a8c79] uppercase tracking-wider">Birth Date</span>
            <input type="date" className={ic} value={birth} onChange={e => setBirth(e.target.value)} />
          </label>

          {error && <p className="text-xs text-rose-400 bg-rose-900/20 border border-rose-900 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#2a3029] text-sm text-[#7a8c79] hover:text-[#e8ead6] transition-colors">
              Later
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#6dba7d] text-[#0f1210] text-sm font-semibold hover:bg-[#7dca8d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <CheckIcon /> {loading ? 'Confirming…' : 'Confirm Animal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Inner page (uses useSearchParams inside Suspense) ─────
function DashboardInner() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [animals,       setAnimals]       = useState<Livestock[]>([]);
  const [stats,         setStats]         = useState<StatsDTO>({
    totalAnimals: 0, pregnant: 0, drafts: 0,
    males: 0, females: 0, activeAnimals: 0, avgAgeMonths: 0,
  });
  const [loading,       setLoading]       = useState(true);
  const [apiError,      setApiError]      = useState<string | null>(null);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const [modalOpen,     setModalOpen]     = useState(false);
  const [editTarget,    setEditTarget]    = useState<Livestock | null>(null);
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState<string | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<Livestock | null>(null);
  const [confLoading,   setConfLoading]   = useState(false);
  const [confError,     setConfError]     = useState<string | null>(null);

  const [sortField,   setSortField]   = useState<SortField>('id');
  const [sortDir,     setSortDir]     = useState<SortDir>('asc');
  const [search,      setSearch]      = useState('');
  const [filterDraft, setFilterDraft] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true); setApiError(null);
    try {
      const [a, s, u] = await Promise.all([fetchAllLivestock(), fetchStats(), fetchUnreadCount()]);
      setAnimals(a); setStats(s); setUnreadCount(u);
    } catch (e: any) { setApiError(e.message ?? 'Failed to connect to backend'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  // Deep link: ?confirm=ID from notifications page
  useEffect(() => {
    const cid = searchParams.get('confirm');
    if (cid && animals.length > 0) {
      const target = animals.find(a => a.id === parseInt(cid));
      if (target?.isDraft) { setConfirmTarget(target); setConfError(null); }
      router.replace('/');
    }
  }, [searchParams, animals, router]);

  const filtered = useMemo(() => {
    let list = [...animals];
    if (filterDraft) list = list.filter(a => a.isDraft);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.tagNumber.toLowerCase().includes(q) ||
        a.species.toLowerCase().includes(q) ||
        a.gender.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const cmp = String(a[sortField] ?? '').localeCompare(String(b[sortField] ?? ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [animals, search, sortField, sortDir, filterDraft]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleSubmit = async (dto: LivestockDTO) => {
    setFormLoading(true); setFormError(null);
    try {
      if (editTarget) await updateLivestock(editTarget.id, dto);
      else            await createLivestock(dto);
      setModalOpen(false); setEditTarget(null); await loadData();
    } catch (e: any) { setFormError(e.message ?? 'Error saving'); }
    finally { setFormLoading(false); }
  };

  const handleConfirm = async (id: number, dto: Partial<LivestockDTO>) => {
    setConfLoading(true); setConfError(null);
    try {
      await confirmDraft(id, dto);
      setConfirmTarget(null); await loadData();
    } catch (e: any) { setConfError(e.message ?? 'Error confirming'); }
    finally { setConfLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this animal?')) return;
    try { await deleteLivestock(id); await loadData(); }
    catch (e: any) { alert(e.message); }
  };

  const draftsCount = animals.filter(a => a.isDraft).length;

  type Col = { key: SortField; label: string };
  const cols: Col[] = [
    { key: 'id',                label: '#'              },
    { key: 'tagNumber',         label: 'Tag'            },
    { key: 'species',           label: 'Species'        },
    { key: 'gender',            label: 'Gender'         },
    { key: 'age',               label: 'Age'            },
    { key: 'birthDate',         label: 'Born'           },
    { key: 'pregnancyDate',     label: 'Pregnant'       },
    { key: 'expectedBirthDate', label: 'Expected Birth' },
    { key: 'status',            label: 'Status'         },
  ];

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#0f1210]">
      {/* Nav */}
      <header className="border-b border-[#2a3029] px-8 py-4 flex items-center justify-between sticky top-0 bg-[#0f1210]/90 backdrop-blur-sm z-40">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-display text-lg text-[#e8ead6]">SmartLivestock</span>
            <span className="ml-1 px-2 py-0.5 rounded text-xs font-mono bg-[#1e2520] border border-[#2a3029] text-[#6dba7d]">v1.0</span>
          </div>
          <nav className="flex items-center gap-1">
            <a href="/"              className="px-3 py-1.5 rounded-lg text-sm text-[#e8ead6] bg-[#1e2520] border border-[#2a3029]">Dashboard</a>
            <a href="/groups"        className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors">Groups</a>
            <a href="/notifications" className="relative px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors flex items-center gap-1.5">
              🔔 Messages
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-[#d97777] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </a>
            <a href="/ai"            className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors flex items-center gap-1.5">
              <span className="text-xs">✨</span> AI
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#7a8c79] font-mono hidden md:block">{user.fullName}</span>
          <button onClick={() => { setEditTarget(null); setFormError(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6dba7d] text-[#0f1210] text-sm font-semibold hover:bg-[#7dca8d] transition-colors">
            + Add Animal
          </button>
          <button onClick={logout} className="text-xs text-[#7a8c79] hover:text-rose-400 border border-[#2a3029] px-3 py-1.5 rounded-lg transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-6">
        <div className="animate-fade-in">
          <h1 className="font-display text-4xl text-[#e8ead6]">Farm Dashboard</h1>
          <p className="text-sm text-[#7a8c79] mt-1">Welcome back, {user.fullName}</p>
        </div>

        {/* Draft offspring alert */}
        {draftsCount > 0 && (
          <div className="flex items-center justify-between gap-4 bg-[#6dba7d]/10 border border-[#6dba7d]/40 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🐣</span>
              <p className="text-sm text-[#6dba7d]">
                <span className="font-semibold">{draftsCount} draft offspring</span> awaiting your confirmation.
              </p>
            </div>
            <button onClick={() => setFilterDraft(true)}
              className="text-xs font-mono text-[#6dba7d] border border-[#6dba7d]/40 px-3 py-1.5 rounded-lg hover:bg-[#6dba7d]/10 transition-colors shrink-0">
              View drafts →
            </button>
          </div>
        )}

        {apiError && (
          <div className="rounded-xl border border-rose-900 bg-rose-900/20 px-5 py-4 text-sm text-rose-300 font-mono">
            ⚠ {apiError} — make sure Spring Boot is running on port 8080
          </div>
        )}

        {/* Primary stats row */}
        <div className="grid grid-cols-3 gap-5 stagger">
          <StatCard label="Total Animals" value={stats.totalAnimals}  accent="text-[#6dba7d]" emoji="🐄" />
          <StatCard label="Pregnant"      value={stats.pregnant}      accent="text-[#d4a84b]" emoji="🌱" />
          <StatCard label="Drafts"        value={stats.drafts}        accent="text-[#5bbfb0]" emoji="🐣" />
        </div>

        {/* Secondary stats row */}
        <div className="grid grid-cols-4 gap-4 stagger">
          <StatCard label="Active"        value={stats.activeAnimals} accent="text-[#6dba7d]" emoji="✅" small />
          <StatCard label="Females"       value={stats.females}       accent="text-[#d4a84b]" emoji="♀"  small />
          <StatCard label="Males"         value={stats.males}         accent="text-[#5bbfb0]" emoji="♂"  small />
          <StatCard label="Avg Age (mo.)" value={stats.avgAgeMonths}  accent="text-[#e8ead6]" emoji="📅" small />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[#2a3029] bg-[#161a17] overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#2a3029]">
            <div className="flex items-center gap-3 flex-wrap">
              <input type="text" placeholder="Search tag, species, status…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#1e2520] border border-[#2a3029] rounded-lg px-3 py-2 text-sm text-[#e8ead6] placeholder:text-[#7a8c79] focus:outline-none focus:border-[#6dba7d] transition-colors w-56" />
              <label className="flex items-center gap-2 text-sm text-[#7a8c79] cursor-pointer select-none">
                <input type="checkbox" checked={filterDraft} onChange={e => setFilterDraft(e.target.checked)} className="accent-[#6dba7d]" />
                Drafts only
              </label>
              {filterDraft && (
                <button onClick={() => setFilterDraft(false)} className="text-xs font-mono text-[#7a8c79] hover:text-[#e8ead6] underline">
                  Clear
                </button>
              )}
            </div>
            <span className="text-xs font-mono text-[#7a8c79] shrink-0">{filtered.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a3029]">
                  {cols.map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}
                      className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-[#7a8c79] cursor-pointer hover:text-[#e8ead6] select-none whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        {col.label}
                        <span className={sortField === col.key ? 'opacity-100' : 'opacity-20'}>
                          {sortField === col.key && sortDir === 'asc' ? <SortUpIcon /> : <SortDnIcon />}
                        </span>
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Draft</th>
                  <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1e2520]">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-[#1e2520] rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-[#7a8c79] font-mono text-sm">
                      No animals found.
                    </td>
                  </tr>
                ) : filtered.map(animal => (
                  <tr key={animal.id}
                    className={`border-b border-[#1e2520] transition-colors
                      ${animal.isDraft ? 'bg-[#6dba7d]/5 hover:bg-[#6dba7d]/10' : 'hover:bg-[#1e2520]/50'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#7a8c79]">{animal.id}</td>
                    <td className="px-4 py-3 font-mono text-sm font-medium text-[#6dba7d]">
                      {animal.tagNumber}
                      {animal.parentId && (
                        <span className="ml-1.5 text-xs text-[#7a8c79] font-normal">↳ #{animal.parentId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span>{speciesIcon(animal.species)}</span>{animal.species}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[#7a8c79]">{animal.gender}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#5bbfb0]">{animal.age ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#7a8c79]">{fmt(animal.birthDate)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#d4a84b]">
                      {animal.gender === 'Male'
                        ? <span className="text-[#3a4239] italic">N/A</span>
                        : animal.pregnancyDate ? fmt(animal.pregnancyDate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[#6dba7d]">
                      {animal.gender === 'Male'
                        ? <span className="text-[#3a4239] italic">N/A</span>
                        : animal.expectedBirthDate ? fmt(animal.expectedBirthDate) : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={animal.status} /></td>
                    <td className="px-4 py-3">
                      {animal.isDraft
                        ? <span className="text-xs font-mono text-[#5bbfb0] border border-[#5bbfb0]/40 bg-[#5bbfb0]/10 px-2 py-0.5 rounded">Draft</span>
                        : <span className="text-xs text-[#3a4239]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {animal.isDraft && (
                          <button onClick={() => { setConfError(null); setConfirmTarget(animal); }}
                            title="Confirm offspring"
                            className="p-1.5 rounded-md text-[#6dba7d] hover:bg-[#6dba7d]/20 border border-[#6dba7d]/30 transition-colors">
                            <CheckIcon />
                          </button>
                        )}
                        <button onClick={() => { setEditTarget(animal); setFormError(null); setModalOpen(true); }}
                          title="Edit" className="p-1.5 rounded-md text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#2a3029] transition-colors">
                          <EditIcon />
                        </button>
                        <button onClick={() => handleDelete(animal.id)}
                          title="Delete" className="p-1.5 rounded-md text-[#7a8c79] hover:text-rose-400 hover:bg-rose-900/20 transition-colors">
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs font-mono text-[#3a4239] text-center pb-4">
          SmartLivestock · Spring Boot 3 + Next.js 14 · Sheep: +150d · Cow: +283d · Auto-birth check: daily 08:00
        </p>
      </main>

      <AnimalModal open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSubmit={handleSubmit} editTarget={editTarget}
        loading={formLoading} error={formError} />

      <ConfirmDraftModal animal={confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirm}
        loading={confLoading} error={confError} />
    </div>
  );
}

// ── Page export wrapped in Suspense (required for useSearchParams) ──
export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
