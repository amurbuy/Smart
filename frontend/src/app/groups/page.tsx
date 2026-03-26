'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAllGroups, createGroup, updateGroup, deleteGroup,
  fetchAllLivestock,
} from '@/api';
import type { AnimalGroup, AnimalGroupDTO, Livestock } from '@/types';

const speciesIcon = (s: string) =>
  s === 'Cow' ? '🐄' : s === 'Sheep' ? '🐑' : s === 'Goat' ? '🐐' : s === 'Horse' ? '🐎' : '🐷';

// ── Group Modal ───────────────────────────────────────────
function GroupModal({ open, onClose, onSubmit, editTarget, allAnimals, loading, error }: {
  open: boolean; onClose: () => void;
  onSubmit: (dto: AnimalGroupDTO) => Promise<void>;
  editTarget: AnimalGroup | null;
  allAnimals: Livestock[];
  loading: boolean; error: string | null;
}) {
  const [name,     setName]     = useState('');
  const [desc,     setDesc]     = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (editTarget) {
      setName(editTarget.name);
      setDesc(editTarget.description ?? '');
      setSelected(editTarget.animals.map(a => a.id));
    } else {
      setName(''); setDesc(''); setSelected([]);
    }
    setSearch('');
  }, [editTarget, open]);

  if (!open) return null;

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const visibleAnimals = search.trim()
    ? allAnimals.filter(a =>
        a.tagNumber.toLowerCase().includes(search.toLowerCase()) ||
        a.species.toLowerCase().includes(search.toLowerCase()))
    : allAnimals;

  const ic = "bg-[#1e2520] border border-[#2a3029] rounded-lg px-3 py-2 text-sm text-[#e8ead6] focus:outline-none focus:border-[#6dba7d] transition-colors w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#161a17] border border-[#2a3029] rounded-2xl w-full max-w-lg mx-4 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2a3029]">
          <h2 className="font-display text-xl text-[#e8ead6]">{editTarget ? 'Edit Group' : 'Create Group'}</h2>
          <button onClick={onClose} className="text-[#7a8c79] hover:text-[#e8ead6] text-xl leading-none">✕</button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); await onSubmit({ name, description: desc || null, animalIds: selected }); }}
          className="flex flex-col gap-4 px-6 py-5 overflow-y-auto">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Group Name</span>
            <input required className={ic} value={name} placeholder="e.g. Pregnant Cows"
              onChange={e => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Description</span>
            <input className={ic} value={desc} placeholder="Optional description"
              onChange={e => setDesc(e.target.value)} />
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">
                Select Animals ({selected.length} selected)
              </span>
            </div>
            <input className={ic} placeholder="Search by tag or species…" value={search}
              onChange={e => setSearch(e.target.value)} />
            <div className="bg-[#1e2520] border border-[#2a3029] rounded-lg overflow-y-auto max-h-48">
              {visibleAnimals.length === 0 ? (
                <p className="text-xs text-[#7a8c79] px-3 py-4 text-center">No animals found</p>
              ) : visibleAnimals.map(animal => {
                const checked = selected.includes(animal.id);
                return (
                  <label key={animal.id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-[#2a3029] last:border-b-0 transition-colors
                      ${checked ? 'bg-[#6dba7d]/10' : 'hover:bg-[#2a3029]/50'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(animal.id)}
                      className="accent-[#6dba7d] w-4 h-4 shrink-0" />
                    <span className="text-base">{speciesIcon(animal.species)}</span>
                    <span className="text-sm font-mono text-[#6dba7d]">{animal.tagNumber}</span>
                    <span className="text-sm text-[#7a8c79]">{animal.species} · {animal.gender}</span>
                    {animal.isDraft && (
                      <span className="ml-auto text-xs font-mono text-[#5bbfb0] border border-[#5bbfb0]/40 bg-[#5bbfb0]/10 px-1.5 py-0.5 rounded">Draft</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

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

// ── Page ──────────────────────────────────────────────────
export default function GroupsPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [groups,      setGroups]      = useState<AnimalGroup[]>([]);
  const [allAnimals,  setAllAnimals]  = useState<Livestock[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<AnimalGroup | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [g, a] = await Promise.all([fetchAllGroups(), fetchAllLivestock()]);
      setGroups(g); setAllAnimals(a);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleSubmit = async (dto: AnimalGroupDTO) => {
    setFormLoading(true); setFormError(null);
    try {
      if (editTarget) await updateGroup(editTarget.id, dto);
      else            await createGroup(dto);
      setModalOpen(false); setEditTarget(null);
      await loadData();
    } catch (e: any) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this group?')) return;
    try { await deleteGroup(id); await loadData(); }
    catch (e: any) { alert(e.message); }
  };

  // Aggregate stats across all groups
  const totalInGroups = groups.reduce((acc, g) => acc + g.animals.length, 0);
  const pregnantInGroups = groups.reduce((acc, g) =>
    acc + g.animals.filter(a => a.pregnancyDate).length, 0);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#0f1210]">
      {/* Nav */}
      <header className="border-b border-[#2a3029] px-8 py-4 flex items-center justify-between sticky top-0 bg-[#0f1210]/90 backdrop-blur-sm z-40">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 text-[#7a8c79] hover:text-[#e8ead6] transition-colors">
            <span className="text-xl">🌿</span>
            <span className="font-display text-lg">SmartLivestock</span>
          </a>
          <nav className="flex items-center gap-1">
            <a href="/"              className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors">Dashboard</a>
            <a href="/groups"        className="px-3 py-1.5 rounded-lg text-sm text-[#e8ead6] bg-[#1e2520] border border-[#2a3029]">Groups</a>
            <a href="/notifications" className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors">🔔 Messages</a>
            <a href="/ai"            className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors flex items-center gap-1.5">
              <span className="text-xs">✨</span> AI
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#7a8c79] font-mono">{user.fullName}</span>
          <button onClick={logout} className="text-xs text-[#7a8c79] hover:text-rose-400 border border-[#2a3029] px-3 py-1.5 rounded-lg transition-colors">Sign out</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl text-[#e8ead6]">Animal Groups</h1>
            <p className="text-sm text-[#7a8c79] mt-1">Organise your livestock into named groups</p>
          </div>
          <button onClick={() => { setEditTarget(null); setFormError(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6dba7d] text-[#0f1210] text-sm font-semibold hover:bg-[#7dca8d] transition-colors">
            + New Group
          </button>
        </div>

        {/* Overall group stats */}
        {groups.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#161a17] border border-[#2a3029] rounded-xl px-5 py-4 flex flex-col gap-1">
              <p className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Total Groups</p>
              <p className="text-3xl font-display text-[#6dba7d]">{groups.length}</p>
            </div>
            <div className="bg-[#161a17] border border-[#2a3029] rounded-xl px-5 py-4 flex flex-col gap-1">
              <p className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Animals in Groups</p>
              <p className="text-3xl font-display text-[#5bbfb0]">{totalInGroups}</p>
            </div>
            <div className="bg-[#161a17] border border-[#2a3029] rounded-xl px-5 py-4 flex flex-col gap-1">
              <p className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Pregnant in Groups</p>
              <p className="text-3xl font-display text-[#d4a84b]">{pregnantInGroups}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-900 bg-rose-900/20 px-5 py-4 text-sm text-rose-300 font-mono">⚠ {error}</div>
        )}

        {/* Group cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#161a17] border border-[#2a3029] rounded-xl p-5 animate-pulse h-48" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <span className="text-5xl opacity-30">🐄</span>
            <p className="text-[#7a8c79] font-mono text-sm">No groups yet. Create one to get started.</p>
            <button onClick={() => { setEditTarget(null); setFormError(null); setModalOpen(true); }}
              className="mt-2 px-4 py-2 rounded-lg bg-[#6dba7d] text-[#0f1210] text-sm font-semibold hover:bg-[#7dca8d] transition-colors">
              + New Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map(group => {
              const females  = group.animals.filter(a => a.gender === 'Female').length;
              const males    = group.animals.filter(a => a.gender === 'Male').length;
              const pregnant = group.animals.filter(a => a.pregnancyDate).length;
              const drafts   = group.animals.filter(a => a.isDraft).length;
              return (
                <div key={group.id} className="bg-[#161a17] border border-[#2a3029] rounded-xl p-5 flex flex-col gap-4 hover:border-[#3a4239] transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg text-[#e8ead6]">{group.name}</h3>
                      {group.description && (
                        <p className="text-xs text-[#7a8c79] mt-0.5">{group.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-mono bg-[#1e2520] border border-[#2a3029] px-2 py-0.5 rounded text-[#6dba7d]">
                      {group.animals.length} animals
                    </span>
                  </div>

                  {/* Mini stats */}
                  {group.animals.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-[#1e2520] rounded-lg px-2 py-1.5 text-center">
                        <p className="text-xs text-[#7a8c79] font-mono">♀</p>
                        <p className="text-sm font-display text-[#d4a84b]">{females}</p>
                      </div>
                      <div className="bg-[#1e2520] rounded-lg px-2 py-1.5 text-center">
                        <p className="text-xs text-[#7a8c79] font-mono">♂</p>
                        <p className="text-sm font-display text-[#5bbfb0]">{males}</p>
                      </div>
                      <div className="bg-[#1e2520] rounded-lg px-2 py-1.5 text-center">
                        <p className="text-xs text-[#7a8c79] font-mono">preg</p>
                        <p className="text-sm font-display text-[#6dba7d]">{pregnant}</p>
                      </div>
                      <div className="bg-[#1e2520] rounded-lg px-2 py-1.5 text-center">
                        <p className="text-xs text-[#7a8c79] font-mono">draft</p>
                        <p className="text-sm font-display text-[#e8ead6]">{drafts}</p>
                      </div>
                    </div>
                  )}

                  {/* Animal chips */}
                  {group.animals.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {group.animals.slice(0, 6).map(a => (
                        <span key={a.id} className="inline-flex items-center gap-1 text-xs font-mono bg-[#1e2520] border border-[#2a3029] px-2 py-0.5 rounded text-[#7a8c79]">
                          <span>{speciesIcon(a.species)}</span>{a.tagNumber}
                        </span>
                      ))}
                      {group.animals.length > 6 && (
                        <span className="text-xs font-mono text-[#7a8c79] px-2 py-0.5">
                          +{group.animals.length - 6} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#3a4239] font-mono">No animals in this group</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-3 border-t border-[#2a3029]">
                    <button onClick={() => { setEditTarget(group); setFormError(null); setModalOpen(true); }}
                      className="flex-1 py-1.5 rounded-lg border border-[#2a3029] text-xs text-[#7a8c79] hover:text-[#e8ead6] hover:border-[#3a4239] transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(group.id)}
                      className="flex-1 py-1.5 rounded-lg border border-[#2a3029] text-xs text-[#7a8c79] hover:text-rose-400 hover:border-rose-900 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <GroupModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSubmit={handleSubmit}
        editTarget={editTarget}
        allAnimals={allAnimals}
        loading={formLoading}
        error={formError}
      />
    </div>
  );
}
