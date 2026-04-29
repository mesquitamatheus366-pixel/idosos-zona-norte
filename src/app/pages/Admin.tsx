import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Users, Calendar, ShoppingBag, Handshake, Plus, Edit2, Trash2, LogOut, Save, X, Database, AlertTriangle, ExternalLink, RefreshCw, Shield, Trophy, Crosshair, Upload, Camera, ImageIcon, Loader2, Cake, ChevronDown, Search, Newspaper, Star, CalendarDays, Clock, UserX, UserCheck, ClipboardList, Ban, Settings } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '../lib/supabase';

// Import existing static data for seeding
import { players as staticPlayersData } from '../data/players';
import { matches as staticMatchesData } from '../data/matches';
import type { Match, PlayerMatchStat } from '../data/matches';
import { getSadockScore, getAdversarioScore, getMatchResult, sortMatchesByDate } from '../data/matches';
import { playerPhotoMap } from '../data/playerPhotos';
import { computePlayerStatsFromSumula } from '../data/statsFromSumula';

// Player positions
const POSITIONS = ['Goleiro', 'Fixo', 'Ala', 'Meio', 'Pivô'];
const DEFAULT_TEMPORADAS = ['2024', '2025', '2026'];

// Static shop products for seeding
const staticShopProducts = [
  { id: "p1", nome: "Uniforme 1", preco: "R$ 70,00", categoria: "Camisas", descricao: "Camisa oficial principal do Sadock FC, preta com detalhes dourados. Material de alta qualidade com tecnologia dry-fit. Patrocínio Ture Publicidade.", estoque: 50 },
  { id: "p2", nome: "Uniforme 2", preco: "R$ 70,00", categoria: "Camisas", descricao: "Camisa oficial reserva do Sadock FC, rosa com detalhes brancos. Material de alta qualidade com tecnologia dry-fit. Patrocínio Ture Publicidade.", estoque: 45 },
  { id: "p3", nome: "Uniforme Comissão Técnica", preco: "R$ 70,00", categoria: "Camisas", descricao: "Camisa oficial da comissão técnica do Sadock FC, branca com detalhes pretos. Material de alta qualidade. Patrocínio Ture Publicidade.", estoque: 20 },
  { id: "p4", nome: "Uniforme Goleiro", preco: "R$ 70,00", categoria: "Camisas", descricao: "Camisa oficial de goleiro do Sadock FC, verde com detalhes brancos. Material de alta qualidade com tecnologia dry-fit. Patrocínio Ture Publicidade.", estoque: 15 },
  { id: "p5", nome: "Boné Sadock FC", preco: "R$ 59,90", categoria: "Acessórios", descricao: "Boné oficial com bordado do escudo do Sadock FC. Ajuste regulável.", estoque: 30 },
  { id: "p6", nome: "Caneca Sadock FC", preco: "R$ 39,90", categoria: "Acessórios", descricao: "Caneca de cerâmica com o escudo do Sadock FC. Capacidade 350ml.", estoque: 40 },
];

// Static sponsors for seeding
const staticSponsors = [
  {
    id: "1",
    nome: "Artemis Art Tattoo",
    tipo: "Parceiro",
    descricao: "Estúdio de tatuagens autorais. Parceiro oficial do Sadock FC com arte e estilo único.",
    instagram: "https://www.instagram.com/artemisarttattoo/?hl=pt-br",
    website: "artemisarttattoo.com"
  },
  {
    id: "2",
    nome: "Ture Publicidade",
    tipo: "Parceiro",
    descricao: "Agência de publicidade e comunicação visual. Responsável pela identidade e materiais gráficos do clube.",
    instagram: "https://www.instagram.com/turepublicidade/?hl=pt-br",
    website: "turepublicidade.com.br"
  },
];

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-039eccc6`;

/* ═══════════════════════════════════════════
   Reusable UI pieces
   ═══════════════════════════════════════════ */

function StatCard({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="relative group">
      <div className={`p-5 rounded-xl border transition-all duration-300 ${
        accent
          ? 'bg-[#d3b379]/[0.06] border-[#d3b379]/20 hover:border-[#d3b379]/40'
          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            accent ? 'bg-[#d3b379]/15' : 'bg-white/[0.04]'
          }`}>
            <Icon className={`w-4 h-4 ${accent ? 'text-[#d3b379]' : 'text-white/40'}`} />
          </div>
          <span className="font-['Montserrat',sans-serif] text-[10px] tracking-[0.2em] text-white/40 uppercase">{label}</span>
        </div>
        <p className={`font-['Anton',sans-serif] text-3xl ${accent ? 'text-[#d3b379]' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

function AdminButton({ onClick, children, variant = 'ghost', disabled = false, className = '' }: any) {
  const base = 'px-4 py-2 font-["Montserrat",sans-serif] text-[10px] tracking-[0.15em] uppercase rounded-lg transition-all duration-200 flex items-center gap-2 font-semibold disabled:opacity-40';
  const variants: Record<string, string> = {
    ghost: 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08]',
    primary: 'bg-[#d3b379] text-[#0b0b0b] hover:bg-[#c4a265] shadow-[0_0_20px_rgba(211,179,121,0.1)] hover:shadow-[0_0_24px_rgba(211,179,121,0.2)]',
    danger: 'text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] border border-transparent hover:border-red-500/20',
    outline: 'text-white/60 hover:text-white border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]',
    gold: 'text-[#d3b379] bg-[#d3b379]/[0.08] border border-[#d3b379]/20 hover:bg-[#d3b379]/[0.15] hover:border-[#d3b379]/40',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant] || variants.ghost} ${className}`}>
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════
   Filter Components
   ═══════════════════════════════════════════ */

function AdminFilterBar({ searchQuery, onSearchChange, searchPlaceholder, totalCount, filteredCount, children }: {
  searchQuery: string; onSearchChange: (v: string) => void; searchPlaceholder: string;
  totalCount: number; filteredCount: number; children: React.ReactNode;
}) {
  const hasFilter = searchQuery || totalCount !== filteredCount;
  return (
    <div className="mb-5 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]">
      {/* Search + count */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-white text-xs font-['Montserrat',sans-serif] placeholder:text-white/20 focus:outline-none focus:border-[#d3b379]/30 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {hasFilter && (
          <span className="font-['Montserrat',sans-serif] text-[10px] text-white/25 shrink-0 tabular-nums">
            {filteredCount}/{totalCount}
          </span>
        )}
      </div>
      {/* Filter pills row */}
      <div className="flex items-center gap-2 flex-wrap">
        {children}
      </div>
    </div>
  );
}

function FilterPills({ options, value, onChange, labels, colors }: {
  options: string[]; value: string; onChange: (v: string) => void;
  labels?: Record<string, string>; colors?: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => {
        const active = value === opt;
        const label = labels?.[opt] || opt;
        const activeColor = colors?.[opt];
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider font-['Montserrat',sans-serif] font-medium transition-all duration-200 cursor-pointer border ${
              active
                ? activeColor
                  ? `${activeColor} border-transparent`
                  : 'text-[#0b0b0b] bg-[#d3b379] border-[#d3b379] shadow-[0_0_8px_rgba(211,179,121,0.15)]'
                : 'text-white/30 border-white/[0.04] hover:text-white/50 hover:border-white/[0.1]'
            } ${active && activeColor ? (
              opt === 'V' ? 'bg-emerald-400/15 border-emerald-400/25' :
              opt === 'E' ? 'bg-amber-400/15 border-amber-400/25' :
              opt === 'D' ? 'bg-red-400/15 border-red-400/25' : ''
            ) : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Admin Component
   ═══════════════════════════════════════════ */

export function Admin() {
  const { user, accessToken, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Always get a fresh token — force refresh if needed to avoid stale/expired JWTs
  async function getFreshToken(): Promise<string> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.access_token) {
      const expiresAt = sessionData.session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt && expiresAt - now > 60) {
        return sessionData.session.access_token;
      }
    }
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.access_token) {
      console.error('Token refresh failed:', refreshError);
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    return refreshData.session.access_token;
  }

  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await getFreshToken();
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${publicAnonKey}`);
    headers.set('X-User-Token', token);
    return fetch(url, { ...options, headers });
  }

  const [activeTab, setActiveTab] = useState<'players' | 'matches' | 'shop' | 'sponsors' | 'news' | 'settings'>('players');
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [matchesList, setMatchesList] = useState<any[]>([]);
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [coachesList, setCoachesList] = useState<any[]>([]);
  const [temporadasList, setTemporadasList] = useState<string[]>(DEFAULT_TEMPORADAS);
  const [newTemporada, setNewTemporada] = useState('');
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [addingCoach, setAddingCoach] = useState(false);
  const [newCoachData, setNewCoachData] = useState<any>({ nome: '', foto: null, atual: false, periodoInicio: '', periodoFim: '', aniversario: '', cargo: 'Treinador' });
  const [uploadingCoachPhoto, setUploadingCoachPhoto] = useState<string | null>(null); // coachId or 'new'
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [editingShopItem, setEditingShopItem] = useState<any>(null);
  const [editingSponsor, setEditingSponsor] = useState<any>(null);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [selectingCandidatosFor, setSelectingCandidatosFor] = useState<any>(null);
  const [selectedCandidatos, setSelectedCandidatos] = useState<string[]>([]);

  // ── Filters ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('Todas');
  const [filterTemporada, setFilterTemporada] = useState('Todas');
  const [filterResultado, setFilterResultado] = useState('Todos');
  const [filterCategoria, setFilterCategoria] = useState('Todas');
  const [filterAdversario, setFilterAdversario] = useState('Todos');
  const [filterSponsorTipo, setFilterSponsorTipo] = useState('Todos');
  const [filterNewsCategoria, setFilterNewsCategoria] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Ativos');
  const [generatingSumulas, setGeneratingSumulas] = useState(false);

  // Reset search when changing tabs
  useEffect(() => {
    setSearchQuery('');
    setFilterPosition('Todas');
    setFilterTemporada('Todas');
    setFilterResultado('Todos');
    setFilterCategoria('Todas');
    setFilterSponsorTipo('Todos');
    setFilterNewsCategoria('Todas');
    setFilterStatus('Ativos');
  }, [activeTab]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const [autoSeedAttempted, setAutoSeedAttempted] = useState(false);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Auto-seed when data is empty and user is authenticated
  useEffect(() => {
    if (!loading && user && !autoSeedAttempted && !seeding) {
      const hasNoDataCheck = playersList.length === 0 && matchesList.length === 0 && shopItems.length === 0 && sponsors.length === 0;
      if (hasNoDataCheck) {
        setAutoSeedAttempted(true);
        console.log('[Admin] No data found, auto-seeding...');
        toast.info('Banco vazio detectado. Migrando dados automaticamente...');
        (async () => {
          setSeeding(true);
          try {
            const playersToSeed = staticPlayersData.map(({ foto, ...rest }) => ({
              ...rest,
              foto: null,
            }));
            const matchesToSeed = staticMatchesData.map(m => ({ ...m }));
            
            await seedCategory('players', playersToSeed);
            await seedCategory('matches', matchesToSeed);
            await seedCategory('shop_items', staticShopProducts);
            await seedCategory('sponsors', staticSponsors);
            
            toast.success(`Migração automática concluída!`);
            await loadAllData();
          } catch (err: any) {
            console.error('[Admin] Auto-seed error:', err);
            toast.error('Erro na migração automática: ' + (err.message || String(err)));
          } finally {
            setSeeding(false);
          }
        })();
      }
    }
  }, [loading, user, autoSeedAttempted, seeding, playersList.length, matchesList.length, shopItems.length, sponsors.length]);

  async function loadPlayers() {
    try {
      const res = await fetch(`${API_BASE}/players`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      setPlayersList(data.players || []);
    } catch (err) {
      console.error('Error loading players:', err);
    }
  }

  async function loadCoaches() {
    try {
      const res = await fetch(`${API_BASE}/coaches`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      if (data.coaches) setCoachesList(data.coaches);
    } catch (err) {
      console.error('Error loading coaches:', err);
    }
  }

  async function loadTemporadas() {
    try {
      const res = await fetch(`${API_BASE}/temporadas`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      if (data.temporadas) setTemporadasList(data.temporadas);
    } catch (err) {
      console.error('Error loading temporadas:', err);
    }
  }

  async function addTemporada(year: string) {
    try {
      const res = await authFetch(`${API_BASE}/temporadas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temporada: year }),
      });
      const data = await res.json();
      if (res.ok && data.temporadas) {
        setTemporadasList(data.temporadas);
        setNewTemporada('');
        toast.success(`Temporada ${year} adicionada!`);
      } else {
        toast.error(data.error || 'Erro ao adicionar temporada');
      }
    } catch (err) {
      console.error('Error adding temporada:', err);
      toast.error('Erro ao adicionar temporada');
    }
  }

  async function deleteTemporada(year: string) {
    if (!confirm(`Remover a temporada ${year}? Isso NÃO apaga as partidas dessa temporada.`)) return;
    try {
      const res = await authFetch(`${API_BASE}/temporadas/${year}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.temporadas) {
        setTemporadasList(data.temporadas);
        toast.success(`Temporada ${year} removida`);
      } else {
        toast.error(data.error || 'Erro ao remover temporada');
      }
    } catch (err) {
      console.error('Error deleting temporada:', err);
      toast.error('Erro ao remover temporada');
    }
  }

  async function saveCoachById(id: string, data: any) {
    try {
      const res = await authFetch(`${API_BASE}/coaches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadCoaches();
        setEditingCoachId(null);
        toast.success('Treinador atualizado');
      } else {
        const err = await res.json();
        toast.error(`Erro ao salvar: ${err.error}`);
      }
    } catch (err) {
      toast.error('Erro ao salvar treinador');
    }
  }

  async function addCoach(data: any) {
    try {
      const res = await authFetch(`${API_BASE}/coaches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadCoaches();
        setAddingCoach(false);
        setNewCoachData({ nome: '', foto: null, atual: false, periodoInicio: '', periodoFim: '', aniversario: '' });
        toast.success('Treinador adicionado');
      } else {
        const err = await res.json();
        toast.error(`Erro: ${err.error}`);
      }
    } catch (err) {
      toast.error('Erro ao adicionar treinador');
    }
  }

  async function deleteCoach(id: string) {
    if (!confirm('Tem certeza que deseja remover este treinador?')) return;
    try {
      const res = await authFetch(`${API_BASE}/coaches/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCoaches();
        toast.success('Treinador removido');
      } else {
        const err = await res.json();
        toast.error(`Erro: ${err.error}`);
      }
    } catch (err) {
      toast.error('Erro ao remover treinador');
    }
  }

  // Derived: current coach for sumula row
  const coachData = coachesList.find((c: any) => c.atual) || coachesList[0] || { nome: 'Lucas Rocha', foto: null };

  async function loadMatches() {
    try {
      const res = await fetch(`${API_BASE}/matches`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      setMatchesList(data.matches || []);
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  }

  async function loadShopItems() {
    try {
      const res = await fetch(`${API_BASE}/shop`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      setShopItems(data.items || []);
    } catch (err) {
      console.error('Error loading shop items:', err);
    }
  }

  async function loadSponsors() {
    try {
      const res = await fetch(`${API_BASE}/sponsors`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      setSponsors(data.sponsors || []);
    } catch (err) {
      console.error('Error loading sponsors:', err);
    }
  }

  async function loadNews() {
    try {
      const res = await fetch(`${API_BASE}/news`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNewsList(data.news || []);
      } else {
        console.error('Error loading news: status', res.status);
      }
    } catch (err) {
      console.error('Error loading news:', err);
    }
  }

  async function loadAllData() {
    setLoading(true);
    try {
      await Promise.all([
        loadPlayers(),
        loadMatches(),
        loadShopItems(),
        loadSponsors(),
        loadNews(),
        loadCoaches(),
        loadTemporadas()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function seedCategory(key: string, data: any[]) {
    const response = await authFetch(`${API_BASE}/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: data })
    });

    const text = await response.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      console.error(`Seed ${key} - non-JSON response:`, text);
      throw new Error(`Seed ${key} falhou: resposta inesperada do servidor`);
    }

    if (!response.ok) {
      console.error(`Seed ${key} error:`, result);
      throw new Error(result.error || `Seed ${key} falhou (status ${response.status})`);
    }

    return result;
  }

  async function seedAllData() {
    if (!confirm('Isso vai substituir TODOS os dados atuais pelos dados originais do site. Continuar?')) return;

    setSeeding(true);
    try {
      const playersToSeed = staticPlayersData.map(({ foto, ...rest }) => ({
        ...rest,
        foto: null,
      }));
      const matchesToSeed = staticMatchesData.map(m => ({ ...m }));

      await seedCategory('players', playersToSeed);
      await seedCategory('matches', matchesToSeed);
      await seedCategory('shop_items', staticShopProducts);
      await seedCategory('sponsors', staticSponsors);

      toast.success('Migração concluída com sucesso!');
      await loadAllData();
    } catch (err: any) {
      console.error('Seed error:', err);
      toast.error(err.message || 'Erro ao migrar dados');
    } finally {
      setSeeding(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ── Player CRUD ──
  async function savePlayer(player: any) {
    try {
      const isNew = !player.id;
      const url = isNew ? `${API_BASE}/players` : `${API_BASE}/players/${player.id}`;

      const response = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar jogador');

      await loadPlayers();
      setEditingPlayer(null);
      toast.success(isNew ? 'Jogador criado!' : 'Jogador atualizado!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function togglePlayerActive(player: any) {
    const isCurrentlyActive = player.ativo !== false; // default true
    const action = isCurrentlyActive ? 'desativar' : 'reativar';
    if (!confirm(`Tem certeza que deseja ${action} ${player.nome}?`)) return;
    try {
      const updated = { ...player, ativo: !isCurrentlyActive };
      const response = await authFetch(`${API_BASE}/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Erro ao ${action} jogador`);
      }
      await loadPlayers();
      toast.success(isCurrentlyActive ? `${player.nome} desativado` : `${player.nome} reativado!`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleExJogador(player: any) {
    const willBe = !player.exJogador;
    try {
      const updated = { ...player, exJogador: willBe };
      const response = await authFetch(`${API_BASE}/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar jogador');
      }
      await loadPlayers();
      toast.success(willBe
        ? `${player.nome} marcado como Ex-Jogador — aparecerá em "Passaram pelo Clube"`
        : `${player.nome} removido de "Passaram pelo Clube"`
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deletePlayer(player: any) {
    if (!confirm(`⚠️ EXCLUIR PERMANENTEMENTE o jogador "${player.nome}" (#${player.numero})?\n\nEssa ação não pode ser desfeita. Todos os dados do jogador serão removidos.\n\nDica: Se quiser apenas ocultar o jogador das páginas públicas, use "Desativar" em vez de excluir.`)) return;
    try {
      const response = await authFetch(`${API_BASE}/players/${player.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir jogador');
      }
      await loadPlayers();
      toast.success(`${player.nome} excluído permanentemente`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function uploadPlayerPhoto(playerId: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('playerId', playerId);

      const response = await authFetch(`${API_BASE}/upload/player-photo`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao fazer upload');
      return data.url;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  }

  async function uploadCoachPhoto(coachId: string, file: File): Promise<string | null> {
    try {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande (max 5MB)');
        return null;
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('coachId', coachId);
      const response = await authFetch(`${API_BASE}/upload/coach-photo`, {
        method: 'POST',
        body: fd
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao fazer upload');
      return data.url;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  }

  // ── Match CRUD ──
  async function saveMatch(match: any) {
    try {
      const isNew = !match.id;
      const url = isNew ? `${API_BASE}/matches` : `${API_BASE}/matches/${match.id}`;

      const response = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar partida');

      await loadMatches();
      setEditingMatch(null);
      toast.success(isNew ? 'Partida criada!' : 'Partida atualizada!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function uploadTeamLogo(teamName: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamName', teamName);

      const response = await authFetch(`${API_BASE}/upload/team-logo`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao fazer upload');
      return data.url;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  }

  async function uploadGenericImage(type: string, file: File): Promise<string | null> {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);

      const response = await authFetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        body: fd
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao fazer upload');
      return data.url;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  }

  async function deleteMatch(id: string) {
    if (!confirm('Tem certeza que deseja remover esta partida?')) return;
    try {
      const response = await authFetch(`${API_BASE}/matches/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover partida');
      }
      await loadMatches();
      toast.success('Partida removida!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ── Generate Sumulas from text fields ──
  async function generateSumulas() {
    setGeneratingSumulas(true);
    try {
      const response = await authFetch(`${API_BASE}/matches/generate-sumulas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar sumulas');
      toast.success(`Sumulas geradas! ${data.updated} atualizadas, ${data.skipped} já tinham sumula.`);
      await loadMatches();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingSumulas(false);
    }
  }

  // ── Shop CRUD ──
  async function saveShopItem(item: any) {
    try {
      const isNew = !item.id;
      const url = isNew ? `${API_BASE}/shop` : `${API_BASE}/shop/${item.id}`;

      const response = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar item');

      await loadShopItems();
      setEditingShopItem(null);
      toast.success(isNew ? 'Item criado!' : 'Item atualizado!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deleteShopItem(id: string) {
    if (!confirm('Tem certeza que deseja remover este item?')) return;
    try {
      const response = await authFetch(`${API_BASE}/shop/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover item');
      }
      await loadShopItems();
      toast.success('Item removido!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ── Sponsor CRUD ──
  async function saveSponsor(sponsor: any) {
    try {
      const isNew = !sponsor.id;
      const url = isNew ? `${API_BASE}/sponsors` : `${API_BASE}/sponsors/${sponsor.id}`;

      const response = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sponsor)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar patrocinador');

      await loadSponsors();
      setEditingSponsor(null);
      toast.success(isNew ? 'Patrocinador criado!' : 'Patrocinador atualizado!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deleteSponsor(id: string) {
    if (!confirm('Tem certeza que deseja remover este patrocinador?')) return;
    try {
      const response = await authFetch(`${API_BASE}/sponsors/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover patrocinador');
      }
      await loadSponsors();
      toast.success('Patrocinador removido!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ── News CRUD ──
  async function saveNews(newsItem: any) {
    try {
      const isNew = !newsItem.id;
      const url = isNew ? `${API_BASE}/news` : `${API_BASE}/news/${newsItem.id}`;

      const response = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsItem)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar noticia');

      await loadNews();
      setEditingNews(null);
      toast.success(isNew ? 'Noticia criada!' : 'Noticia atualizada!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deleteNews(id: string) {
    if (!confirm('Tem certeza que deseja remover esta noticia?')) return;
    try {
      const response = await authFetch(`${API_BASE}/news/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover noticia');
      }
      await loadNews();
      toast.success('Noticia removida!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#d3b379]/30 border-t-[#d3b379] rounded-full animate-spin" />
          <p className="font-['Montserrat',sans-serif] text-[10px] tracking-[0.3em] text-white/30 uppercase">Carregando painel</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasNoData = playersList.length === 0 && matchesList.length === 0 && shopItems.length === 0 && sponsors.length === 0;

  const tabs = [
    { key: 'players' as const, label: 'Jogadores', icon: Users, count: playersList.length },
    { key: 'matches' as const, label: 'Partidas', icon: Calendar, count: matchesList.length },
    { key: 'shop' as const, label: 'Loja', icon: ShoppingBag, count: shopItems.length },
    { key: 'sponsors' as const, label: 'Parceiros', icon: Handshake, count: sponsors.length },
    { key: 'news' as const, label: 'Notícias', icon: Newspaper, count: newsList.length },
    { key: 'settings' as const, label: 'Config', icon: Settings, count: temporadasList.length },
  ];

  // Calculate some derived stats — prefer súmula data
  const totalGols = playersList.reduce((sum, p) => {
    const sumulaStats = computePlayerStatsFromSumula(matchesList, p.id, 'all');
    if (sumulaStats.gols > 0) return sum + sumulaStats.gols;
    if (!p.stats) return sum;
    return sum + (p.stats['2024']?.gols || 0) + (p.stats['2025']?.gols || 0) + (p.stats['2026']?.gols || 0);
  }, 0);

  const victories = matchesList.filter(m => {
    if (m.wo) return m.woTipo === 'sadock';
    const isCasa = m.equipeCasa === 'Sadock FC';
    const ps = isCasa ? m.placarCasa : m.placarFora;
    const pa = isCasa ? m.placarFora : m.placarCasa;
    return ps > pa;
  }).length;

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* ── Top Bar ── */}
      <div className="border-b border-white/[0.04] bg-[#0b0b0b]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#d3b379]/10 border border-[#d3b379]/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#d3b379]" />
              </div>
              <div>
                <h1 className="font-['Montserrat',sans-serif] text-xs font-bold tracking-[0.1em] text-white uppercase">
                  Sadock FC <span className="text-[#d3b379]">Admin</span>
                </h1>
                <p className="font-['Montserrat',sans-serif] text-[9px] text-white/30 tracking-wider">
                  {user.user_metadata?.name || user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <AdminButton onClick={() => loadAllData()} variant="ghost">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Atualizar</span>
              </AdminButton>
              <AdminButton onClick={() => navigate('/')} variant="ghost">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ver Site</span>
              </AdminButton>
              <AdminButton onClick={handleSignOut} variant="ghost">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </AdminButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <StatCard icon={Users} label="Jogadores" value={playersList.length} accent />
          <StatCard icon={Calendar} label="Partidas" value={matchesList.length} />
          <StatCard icon={Trophy} label="Vitorias" value={victories} />
          <StatCard icon={Crosshair} label="Gols" value={totalGols} />
        </div>

        {/* ── Empty State / Seed Banner ── */}
        {hasNoData && (
          <div className="mb-8 p-5 rounded-xl bg-[#d3b379]/[0.04] border border-[#d3b379]/15 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#d3b379]/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#d3b379]" />
            </div>
            <div className="flex-1">
              <p className="font-['Montserrat',sans-serif] text-sm font-semibold text-white mb-0.5">Banco vazio</p>
              <p className="font-['Montserrat',sans-serif] text-xs text-white/40">
                Clique em "Migrar Dados" para popular o banco com todos os dados do site.
              </p>
            </div>
            <AdminButton onClick={seedAllData} disabled={seeding} variant="gold">
              <Database className="w-3.5 h-3.5" />
              {seeding ? 'Migrando...' : 'Migrar Dados'}
            </AdminButton>
          </div>
        )}

        {/* ── Tab Navigation ── */}
        <div className="flex items-center gap-1 mb-8 border-b border-white/[0.04] pb-px overflow-x-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-3 font-['Montserrat',sans-serif] text-[10px] tracking-[0.15em] uppercase transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'text-[#d3b379]'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  active ? 'bg-[#d3b379]/15 text-[#d3b379]' : 'bg-white/[0.04] text-white/25'
                }`}>
                  {tab.count}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#d3b379] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'players' && (() => {
          const filteredPlayers = playersList.filter((p) => {
            if (searchQuery && !p.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterPosition !== 'Todas' && p.posicao !== filterPosition) return false;
            if (filterStatus === 'Ativos' && p.ativo === false) return false;
            if (filterStatus === 'Inativos' && (p.ativo !== false || p.exJogador)) return false;
            if (filterStatus === 'Ex-Jogadores' && !(p.ativo === false && p.exJogador)) return false;
            return true;
          });
          return (
          <TabSection
            title="Jogadores"
            onAdd={() => setEditingPlayer({
              nome: '', posicao: 'Meio', numero: 0, foto: null, instagram: '', aniversario: '', ativo: true,
              stats: {
                '2024': { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
                '2025': { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
                '2026': { jogos: 0, gols: 0, assistencias: 0, mvp: 0 }
              }
            })}
            addLabel="Novo Jogador"
            empty={playersList.length === 0}
            emptyText="Nenhum jogador cadastrado"
          >
            {/* Treinadores Section */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#d3b379]" />
                  <span className="font-['Montserrat',sans-serif] text-[10px] tracking-[0.15em] uppercase text-white/40 font-semibold">Treinadores</span>
                </div>
                <AdminButton variant="gold" onClick={() => setAddingCoach(true)}>
                  <Plus className="w-3.5 h-3.5" /> Novo Treinador
                </AdminButton>
              </div>

              {/* Add coach form */}
              {addingCoach && (
                <div className="p-4 rounded-xl bg-[#d3b379]/[0.03] border border-[#d3b379]/15 space-y-3">
                  <div className="flex gap-4">
                    {/* Photo upload */}
                    <div className="shrink-0">
                      <label className="cursor-pointer group">
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-[#d3b379]/30 bg-[#1a1a1a] flex items-center justify-center transition-all group-hover:border-[#d3b379]/60 ${uploadingCoachPhoto === 'new' ? 'animate-pulse' : ''}`}>
                          {newCoachData.foto ? (
                            <img src={newCoachData.foto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-5 h-5 text-[#d3b379]/40 group-hover:text-[#d3b379]/70 transition-colors" />
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingCoachPhoto('new');
                          const url = await uploadCoachPhoto('new', file);
                          if (url) setNewCoachData({ ...newCoachData, foto: url });
                          setUploadingCoachPhoto(null);
                        }} />
                      </label>
                      <p className="text-[8px] text-white/20 text-center mt-1 font-['Montserrat',sans-serif]">Foto</p>
                    </div>
                    {/* Fields */}
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold">Nome</Label>
                          <Input value={newCoachData.nome} onChange={(e) => setNewCoachData({ ...newCoachData, nome: e.target.value })} placeholder="Nome" className="h-8 bg-[#1a1a1a] border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold">Cargo</Label>
                          <select
                            value={newCoachData.cargo || 'Treinador'}
                            onChange={(e) => setNewCoachData({ ...newCoachData, cargo: e.target.value })}
                            className="h-8 w-full rounded-md bg-[#1a1a1a] border border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm px-2 outline-none"
                          >
                            <option value="Treinador">Treinador</option>
                            <option value="Comissão Técnica">Comissão Técnica</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold">Aniversário</Label>
                          <Input type="date" value={newCoachData.aniversario || ''} onChange={(e) => setNewCoachData({ ...newCoachData, aniversario: e.target.value || null })} className="h-8 bg-[#1a1a1a] border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold">Início</Label>
                          <Input value={newCoachData.periodoInicio} onChange={(e) => setNewCoachData({ ...newCoachData, periodoInicio: e.target.value })} placeholder="2024" className="h-8 bg-[#1a1a1a] border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold">Fim</Label>
                          <Input value={newCoachData.periodoFim || ''} onChange={(e) => setNewCoachData({ ...newCoachData, periodoFim: e.target.value || null })} placeholder="Atual" className="h-8 bg-[#1a1a1a] border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newCoachData.atual} onChange={(e) => setNewCoachData({ ...newCoachData, atual: e.target.checked })} className="accent-[#d3b379]" />
                      <span className="font-['Montserrat',sans-serif] text-xs text-white/50">Membro atual</span>
                    </label>
                    <div className="flex gap-2">
                      <AdminButton variant="ghost" onClick={() => { setAddingCoach(false); setNewCoachData({ nome: '', foto: null, atual: false, periodoInicio: '', periodoFim: '', aniversario: '', cargo: 'Treinador' }); }}><X className="w-3.5 h-3.5" /> Cancelar</AdminButton>
                      <AdminButton variant="primary" onClick={() => addCoach(newCoachData)} disabled={!newCoachData.nome.trim()}><Save className="w-3.5 h-3.5" /> Salvar</AdminButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Coaches list */}
              {[...coachesList].sort((a, b) => (b.atual ? 1 : 0) - (a.atual ? 1 : 0)).map((coach: any) => {
                const isEditing = editingCoachId === coach.id;
                return (
                  <div key={coach.id} className={`p-4 rounded-xl border transition-all ${
                    coach.atual
                      ? 'bg-gradient-to-r from-[#d3b379]/[0.04] to-transparent border-[#d3b379]/15'
                      : 'bg-white/[0.015] border-white/[0.04]'
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Photo - clickable in edit mode */}
                      <div className="shrink-0">
                        {isEditing ? (
                          <label className="cursor-pointer group">
                            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-dashed bg-[#1a1a1a] transition-all ${
                              uploadingCoachPhoto === coach.id ? 'animate-pulse border-[#d3b379]/50' : 'border-[#d3b379]/30 group-hover:border-[#d3b379]/60'
                            }`}>
                              {coach.foto ? (
                                <img src={coach.foto} alt={coach.nome} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Camera className="w-4 h-4 text-[#d3b379]/40 group-hover:text-[#d3b379]/70 transition-colors" />
                                </div>
                              )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingCoachPhoto(coach.id);
                              const url = await uploadCoachPhoto(coach.id, file);
                              if (url) setCoachesList(coachesList.map((c: any) => c.id === coach.id ? { ...c, foto: url } : c));
                              setUploadingCoachPhoto(null);
                            }} />
                          </label>
                        ) : (
                          <div className={`w-14 h-14 rounded-full overflow-hidden border-2 bg-[#1a1a1a] ${
                            coach.atual ? 'border-[#d3b379]/30' : 'border-white/[0.08]'
                          }`}>
                            {coach.foto ? (
                              <img src={coach.foto} alt={coach.nome} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ClipboardList className={`w-5 h-5 ${coach.atual ? 'text-[#d3b379]/40' : 'text-white/15'}`} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-md ${
                            coach.atual
                              ? 'text-[#d3b379]/60 bg-[#d3b379]/[0.08]'
                              : 'text-white/25 bg-white/[0.04]'
                          }`}>
                            {coach.atual ? (coach.cargo || 'Treinador') : `Ex-${coach.cargo || 'Treinador'}`}
                          </span>
                          {coach.periodoInicio && (
                            <span className="font-['Montserrat',sans-serif] text-[9px] text-white/15">
                              {coach.periodoInicio}{coach.periodoFim ? ` – ${coach.periodoFim}` : ' – presente'}
                            </span>
                          )}
                          {coach.aniversario && !isEditing && (
                            <span className="font-['Montserrat',sans-serif] text-[9px] text-white/15 flex items-center gap-1">
                              <Cake className="w-3 h-3" /> {new Date(coach.aniversario + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2 mt-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Input
                                value={coach.nome || ''}
                                onChange={(e) => setCoachesList(coachesList.map((c: any) => c.id === coach.id ? { ...c, nome: e.target.value } : c))}
                                className="h-8 bg-[#1a1a1a] border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm max-w-[160px]"
                                placeholder="Nome"
                              />
                              <select
                                value={coach.cargo || 'Treinador'}
                                onChange={(e) => setCoachesList(coachesList.map((c: any) => c.id === coach.id ? { ...c, cargo: e.target.value } : c))}
                                className="h-8 rounded-md bg-[#1a1a1a] border border-white/[0.08] text-white font-['Montserrat',sans-serif] text-xs px-2 outline-none"
                              >
                                <option value="Treinador">Treinador</option>
                                <option value="Comissão Técnica">Comissão Técnica</option>
                              </select>
                              <div className="flex items-center gap-1">
                                <Cake className="w-3.5 h-3.5 text-white/20" />
                                <Input
                                  type="date"
                                  value={coach.aniversario || ''}
                                  onChange={(e) => setCoachesList(coachesList.map((c: any) => c.id === coach.id ? { ...c, aniversario: e.target.value || null } : c))}
                                  className="h-8 bg-[#1a1a1a] border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm w-[140px]"
                                />
                              </div>
                              <Input
                                value={coach.periodoInicio || ''}
                                onChange={(e) => setCoachesList(coachesList.map((c: any) => c.id === coach.id ? { ...c, periodoInicio: e.target.value } : c))}
                                className="h-8 bg-[#1a1a1a] border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm w-16"
                                placeholder="Início"
                              />
                              <Input
                                value={coach.periodoFim || ''}
                                onChange={(e) => setCoachesList(coachesList.map((c: any) => c.id === coach.id ? { ...c, periodoFim: e.target.value || null } : c))}
                                className="h-8 bg-[#1a1a1a] border-white/[0.08] text-white font-['Montserrat',sans-serif] text-sm w-16"
                                placeholder="Fim"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={coach.atual} onChange={(e) => setCoachesList(coachesList.map((c: any) => c.id === coach.id ? { ...c, atual: e.target.checked } : c))} className="accent-[#d3b379]" />
                                <span className="font-['Montserrat',sans-serif] text-[10px] text-white/40">Atual</span>
                              </label>
                              {coach.foto && (
                                <button onClick={() => setCoachesList(coachesList.map((c: any) => c.id === coach.id ? { ...c, foto: null } : c))} className="font-['Montserrat',sans-serif] text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
                                  Remover foto
                                </button>
                              )}
                              <div className="ml-auto flex gap-1.5">
                                <button onClick={() => saveCoachById(coach.id, coach)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setEditingCoachId(null); loadCoaches(); }} className="p-1.5 rounded-lg bg-white/[0.04] text-white/30 hover:text-white/60 transition-all">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="font-['Montserrat',sans-serif] text-sm font-semibold text-white">{coach.nome}</p>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex gap-1">
                          <button onClick={() => setEditingCoachId(coach.id)} className="p-2 rounded-lg hover:bg-[#d3b379]/10 text-white/30 hover:text-[#d3b379] transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteCoach(coach.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filters */}
            <AdminFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar jogador..."
              totalCount={playersList.length}
              filteredCount={filteredPlayers.length}
            >
              <FilterPills
                options={['Todas', ...POSITIONS]}
                value={filterPosition}
                onChange={setFilterPosition}
              />
              <div className="w-px h-5 bg-white/[0.06]" />
              <FilterPills
                options={['Todos', 'Ativos', 'Inativos', 'Ex-Jogadores']}
                value={filterStatus}
                onChange={setFilterStatus}
              />
            </AdminFilterBar>

            <div className="space-y-2">
              {filteredPlayers.map((player) => {
                const isInactive = player.ativo === false;
                return (
                <div key={player.id} className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  isInactive
                    ? 'bg-white/[0.008] border-white/[0.03] opacity-60'
                    : 'bg-white/[0.015] border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.025]'
                }`}>
                  {/* Avatar */}
                  <div className="relative">
                    {(player.foto || playerPhotoMap[player.id]) ? (
                      <img src={player.foto || playerPhotoMap[player.id]} alt={player.nome} className={`w-11 h-11 rounded-full object-cover ring-1 ring-white/[0.08] ${isInactive ? 'grayscale' : ''}`} />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-white/[0.04] ring-1 ring-white/[0.08] flex items-center justify-center">
                        <span className="font-['Anton',sans-serif] text-sm text-white/20">{player.numero}</span>
                      </div>
                    )}
                    {isInactive && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-['Anton',sans-serif] text-xs text-[#d3b379]/60">#{player.numero}</span>
                      <h3 className={`font-['Montserrat',sans-serif] font-semibold text-sm truncate ${isInactive ? 'text-white/40 line-through' : 'text-white'}`}>{player.nome}</h3>
                      {isInactive && player.exJogador && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] tracking-wider font-['Montserrat',sans-serif] font-bold uppercase bg-[#d3b379]/10 text-[#d3b379]/80 border border-[#d3b379]/20">Ex-Jogador</span>
                      )}
                      {isInactive && !player.exJogador && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] tracking-wider font-['Montserrat',sans-serif] font-bold uppercase bg-red-500/10 text-red-400/80 border border-red-500/20">Inativo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="font-['Montserrat',sans-serif] text-[10px] text-white/30 tracking-wider uppercase">{player.posicao}</span>
                      {(() => {
                        const ss = computePlayerStatsFromSumula(matchesList, player.id, 'all');
                        const gols = ss.gols > 0 ? ss.gols : ((player.stats?.['2024']?.gols || 0) + (player.stats?.['2025']?.gols || 0) + (player.stats?.['2026']?.gols || 0));
                        const assist = ss.assistencias > 0 ? ss.assistencias : ((player.stats?.['2024']?.assistencias || 0) + (player.stats?.['2025']?.assistencias || 0) + (player.stats?.['2026']?.assistencias || 0));
                        return (
                          <span className="font-['Montserrat',sans-serif] text-[10px] text-white/20">
                            {gols} gols · {assist} assist
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => setEditingPlayer(player)} className="p-2 rounded-lg hover:bg-[#d3b379]/10 text-white/30 hover:text-[#d3b379] transition-all" title="Editar">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isInactive && (
                      <button
                        onClick={() => toggleExJogador(player)}
                        className={`p-2 rounded-lg transition-all ${
                          player.exJogador
                            ? 'hover:bg-[#d3b379]/10 text-[#d3b379]/60 hover:text-[#d3b379]'
                            : 'hover:bg-[#d3b379]/10 text-white/30 hover:text-[#d3b379]'
                        }`}
                        title={player.exJogador ? 'Remover de "Passaram pelo Clube"' : 'Marcar como Ex-Jogador (aparece em "Passaram pelo Clube")'}
                      >
                        <Trophy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => togglePlayerActive(player)}
                      className={`p-2 rounded-lg transition-all ${
                        isInactive
                          ? 'hover:bg-emerald-500/10 text-white/30 hover:text-emerald-400'
                          : 'hover:bg-red-500/10 text-white/30 hover:text-red-400'
                      }`}
                      title={isInactive ? 'Reativar jogador' : 'Desativar jogador'}
                    >
                      {isInactive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deletePlayer(player)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                      title="Excluir jogador permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                );
              })}
              {filteredPlayers.length === 0 && playersList.length > 0 && (
                <div className="py-12 text-center">
                  <p className="font-['Montserrat',sans-serif] text-sm text-white/20">Nenhum jogador encontrado</p>
                  <p className="font-['Montserrat',sans-serif] text-xs text-white/10 mt-1">Tente ajustar os filtros</p>
                </div>
              )}
            </div>
          </TabSection>
          );
        })()}

        {activeTab === 'matches' && (() => {
          const competicoes = ['Todas', ...Array.from(new Set(matchesList.map((m: any) => m.competicao).filter(Boolean)))];
          const adversariosList = ['Todos', ...Array.from(new Set(matchesList.map((m: any) => m.equipeCasa === 'Sadock FC' ? m.equipeFora : m.equipeCasa).filter(Boolean))).sort()];
          const filteredMatches = matchesList.filter((match: any) => {
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              if (!match.equipeCasa.toLowerCase().includes(q) && !match.equipeFora.toLowerCase().includes(q) && !(match.local || '').toLowerCase().includes(q)) return false;
            }
            if (filterTemporada !== 'Todas' && match.temporada !== filterTemporada) return false;
            if (filterResultado !== 'Todos') {
              let res: string;
              if (match.wo) {
                res = match.woTipo === 'sadock' ? 'V' : 'D';
              } else {
                const isCasa = match.equipeCasa === 'Sadock FC';
                const pS = isCasa ? match.placarCasa : match.placarFora;
                const pA = isCasa ? match.placarFora : match.placarCasa;
                res = pS > pA ? 'V' : pS < pA ? 'D' : 'E';
              }
              if (filterResultado !== res) return false;
            }
            if (filterCategoria !== 'Todas' && match.competicao !== filterCategoria) return false;
            if (filterAdversario !== 'Todos') {
              const adv = match.equipeCasa === 'Sadock FC' ? match.equipeFora : match.equipeCasa;
              if (adv !== filterAdversario) return false;
            }
            return true;
          });
          return (
          <TabSection
            title="Partidas"
            onAdd={() => setEditingMatch({
              data: '', competicao: '', local: '', temporada: '2026',
              equipeCasa: 'Sadock FC', equipeFora: '', placarCasa: 0, placarFora: 0,
              golsSadock: '', assistenciasSadock: '', adversarioLogo: null
            })}
            addLabel="Nova Partida"
            empty={matchesList.length === 0}
            emptyText="Nenhuma partida cadastrada"
          >
            {/* Generate sumulas action */}
            {matchesList.length > 0 && (() => {
              const withSumula = matchesList.filter((m: any) => m.sumula && Array.isArray(m.sumula) && m.sumula.length > 0).length;
              const withoutSumula = matchesList.length - withSumula;
              return withoutSumula > 0 ? (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/10 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className="w-4 h-4 text-amber-400/60 shrink-0" />
                    <p className="font-['Montserrat',sans-serif] text-[11px] text-white/40">
                      <span className="text-amber-400/70 font-semibold">{withoutSumula}</span> partidas sem sumula &middot;
                      <span className="text-emerald-400/60 ml-1">{withSumula}</span> com sumula
                    </p>
                  </div>
                  <button
                    onClick={generateSumulas}
                    disabled={generatingSumulas}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d3b379]/10 border border-[#d3b379]/20 text-[#d3b379] font-['Montserrat',sans-serif] text-[10px] tracking-wider uppercase hover:bg-[#d3b379]/15 hover:border-[#d3b379]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    {generatingSumulas ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {generatingSumulas ? 'Gerando...' : 'Gerar Sumulas'}
                  </button>
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400/60" />
                  <p className="font-['Montserrat',sans-serif] text-[11px] text-emerald-400/60">
                    Todas as {matchesList.length} partidas possuem sumula
                  </p>
                </div>
              );
            })()}

            {/* Filters */}
            <AdminFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar por time ou local..."
              totalCount={matchesList.length}
              filteredCount={filteredMatches.length}
            >
              <FilterPills
                options={['Todas', ...temporadasList]}
                value={filterTemporada}
                onChange={setFilterTemporada}
              />
              <div className="w-px h-5 bg-white/[0.06]" />
              <FilterPills
                options={['Todos', 'V', 'E', 'D']}
                value={filterResultado}
                onChange={setFilterResultado}
                labels={{ V: 'Vitória', E: 'Empate', D: 'Derrota' }}
                colors={{ V: 'text-emerald-400', E: 'text-amber-400', D: 'text-red-400' }}
              />
              {competicoes.length > 2 && (
                <>
                  <div className="w-px h-5 bg-white/[0.06]" />
                  <div className="relative">
                    <select
                      value={filterCategoria}
                      onChange={(e) => setFilterCategoria(e.target.value)}
                      className="appearance-none bg-[#1a1a1a] text-[10px] tracking-wider font-['Montserrat',sans-serif] pl-3 pr-7 py-1.5 rounded-full border border-white/[0.06] cursor-pointer focus:outline-none focus:border-[#d3b379]/40 transition-colors text-white/40"
                      style={{ color: filterCategoria !== 'Todas' ? '#d3b379' : undefined }}
                    >
                      {competicoes.map((c) => (
                        <option key={c} value={c}>{c === 'Todas' ? 'Competição' : c}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                </>
              )}
              {adversariosList.length > 2 && (
                <>
                  <div className="w-px h-5 bg-white/[0.06]" />
                  <div className="relative">
                    <select
                      value={filterAdversario}
                      onChange={(e) => setFilterAdversario(e.target.value)}
                      className="appearance-none bg-[#1a1a1a] text-[10px] tracking-wider font-['Montserrat',sans-serif] pl-3 pr-7 py-1.5 rounded-full border border-white/[0.06] cursor-pointer focus:outline-none focus:border-[#d3b379]/40 transition-colors text-white/40"
                      style={{ color: filterAdversario !== 'Todos' ? '#d3b379' : undefined }}
                    >
                      {adversariosList.map((a) => (
                        <option key={a} value={a}>{a === 'Todos' ? 'Adversário' : a}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                </>
              )}
            </AdminFilterBar>

            <div className="space-y-2">
              {sortMatchesByDate(filteredMatches, 'desc').map((match: any) => {
                const isCasa = match.equipeCasa === 'Sadock FC';
                const placarSadock = isCasa ? match.placarCasa : match.placarFora;
                const placarAdv = isCasa ? match.placarFora : match.placarCasa;
                const isWo = !!match.wo;
                const resultado = isWo
                  ? (match.woTipo === 'sadock' ? 'V' : 'D')
                  : (placarSadock > placarAdv ? 'V' : placarSadock < placarAdv ? 'D' : 'E');
                const corBg = resultado === 'V' ? 'bg-green-500/10 text-green-400' : resultado === 'D' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400';

                return (
                  <div key={match.id} className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.025] transition-all duration-200">
                    {/* Result badge */}
                    <div className={`${isWo ? 'w-12' : 'w-9'} h-9 rounded-lg flex items-center justify-center font-['Anton',sans-serif] text-sm shrink-0 ${corBg}`}>
                      {isWo ? 'W.O.' : resultado}
                    </div>

                    {/* Adversário logo thumb */}
                    {match.adversarioLogo ? (
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                        <img src={match.adversarioLogo} alt="" className="w-full h-full object-contain p-0.5" />
                      </div>
                    ) : null}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Montserrat',sans-serif] font-semibold text-white text-sm">
                        {match.equipeCasa} <span className="text-white/30 font-normal">{isWo ? 'W.O.' : `${match.placarCasa} × ${match.placarFora}`}</span> {match.equipeFora}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-['Montserrat',sans-serif] text-[10px] text-white/25">{match.data}</span>
                        {match.competicao && (
                          <>
                            <span className="text-white/10">·</span>
                            <span className="font-['Montserrat',sans-serif] text-[10px] text-[#d3b379]/40">{match.competicao}</span>
                          </>
                        )}
                        {match.local && (
                          <>
                            <span className="text-white/10">·</span>
                            <span className="font-['Montserrat',sans-serif] text-[10px] text-white/20">{match.local}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Sumula badge */}
                    {match.sumula && Array.isArray(match.sumula) && match.sumula.length > 0 ? (
                      <span className="font-['Montserrat',sans-serif] text-[9px] text-emerald-400/60 bg-emerald-400/[0.06] px-2 py-1 rounded-md shrink-0 border border-emerald-400/10" title={`Sumula com ${match.sumula.filter((s: any) => s.presente).length} jogadores`}>
                        {match.sumula.filter((s: any) => s.presente).length}J
                      </span>
                    ) : (
                      <span className="font-['Montserrat',sans-serif] text-[9px] text-white/15 bg-white/[0.02] px-2 py-1 rounded-md shrink-0">
                        —
                      </span>
                    )}

                    {/* Season badge */}
                    <span className="font-['Montserrat',sans-serif] text-[9px] text-white/20 bg-white/[0.03] px-2 py-1 rounded-md shrink-0">{match.temporada}</span>

                    {/* Voting status & controls */}
                    {match.votingOpen && (
                      <div className="flex items-center gap-2">
                        <span className="font-['Montserrat',sans-serif] text-[9px] text-[#d3b379] bg-[#d3b379]/[0.1] px-2 py-1 rounded-md shrink-0 border border-[#d3b379]/20 flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d3b379] opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d3b379]" />
                          </span>
                          Votação Aberta
                        </span>
                        <button
                          onClick={async () => {
                            if (!confirm('Fechar votação e definir o craque da partida?')) return;
                            try {
                              const res = await authFetch(`${API_BASE}/matches/${match.id}/close-voting`, { method: 'POST' });
                              if (res.ok) {
                                const data = await res.json();
                                toast.success(`Votação encerrada! ${data.craqueId ? 'Craque definido' : 'Nenhum voto registrado'}`);
                                await loadMatches();
                              } else {
                                const err = await res.json();
                                toast.error(err.error || 'Erro ao fechar votação');
                              }
                            } catch (err) {
                              toast.error('Erro ao fechar votação');
                            }
                          }}
                          className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-['Montserrat',sans-serif] font-medium hover:bg-emerald-500/20 transition-all"
                          title="Fechar votação"
                        >
                          Encerrar
                        </button>
                      </div>
                    )}
                    {!match.votingOpen && match.craqueId && (() => {
                      const craquePlayer = playersList.find((p: any) => p.id === match.craqueId);
                      return craquePlayer ? (
                        <span className="font-['Montserrat',sans-serif] text-[9px] text-amber-400/70 bg-amber-400/[0.08] px-2 py-1 rounded-md shrink-0 border border-amber-400/20 flex items-center gap-1" title="Craque da Partida">
                          <Trophy className="w-3 h-3" />
                          {craquePlayer.nome.split(' ')[0]}
                        </span>
                      ) : null;
                    })()}
                    {!match.votingOpen && !match.craqueId && match.sumula && match.sumula.some((s: any) => s.presente) && (
                      <button
                        onClick={() => {
                          setSelectingCandidatosFor(match);
                          setSelectedCandidatos([]);
                        }}
                        className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/40 text-[9px] font-['Montserrat',sans-serif] font-medium hover:bg-[#d3b379]/10 hover:text-[#d3b379] hover:border-[#d3b379]/30 transition-all"
                        title="Abrir votação para craque da partida"
                      >
                        Abrir Votação
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={() => setEditingMatch(match)} className="p-2 rounded-lg hover:bg-[#d3b379]/10 text-white/30 hover:text-[#d3b379] transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMatch(match.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredMatches.length === 0 && matchesList.length > 0 && (
                <div className="py-12 text-center">
                  <p className="font-['Montserrat',sans-serif] text-sm text-white/20">Nenhuma partida encontrada</p>
                  <p className="font-['Montserrat',sans-serif] text-xs text-white/10 mt-1">Tente ajustar os filtros</p>
                </div>
              )}
            </div>
          </TabSection>
          );
        })()}

        {activeTab === 'shop' && (() => {
          const categorias = ['Todas', ...Array.from(new Set(shopItems.map((i: any) => i.categoria).filter(Boolean)))];
          const filteredShop = shopItems.filter((item: any) => {
            if (searchQuery && !item.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterCategoria !== 'Todas' && item.categoria !== filterCategoria) return false;
            return true;
          });
          return (
          <TabSection
            title="Loja"
            onAdd={() => setEditingShopItem({
              nome: '', preco: 'R$ 0,00', categoria: 'Camisas', descricao: '', image: null, imagens: [], estoque: 0, tamanhos: [], lancamento: false, esgotado: false, destaque: false
            })}
            addLabel="Novo Item"
            empty={shopItems.length === 0}
            emptyText="Nenhum item na loja"
          >
            {/* Filters */}
            <AdminFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar produto..."
              totalCount={shopItems.length}
              filteredCount={filteredShop.length}
            >
              <FilterPills
                options={categorias}
                value={filterCategoria}
                onChange={setFilterCategoria}
              />
            </AdminFilterBar>

            <div className="space-y-2">
              {filteredShop.map((item: any) => (
                <div key={item.id} className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.025] transition-all duration-200">
                  {/* Price badge */}
                  <div className="w-auto min-w-[72px] h-9 px-3 rounded-lg bg-[#d3b379]/[0.08] border border-[#d3b379]/15 flex items-center justify-center shrink-0">
                    <span className="font-['Montserrat',sans-serif] text-[11px] font-bold text-[#d3b379]">{item.preco}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-['Montserrat',sans-serif] font-semibold text-white text-sm truncate">{item.nome}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-['Montserrat',sans-serif] text-[10px] text-white/30 tracking-wider uppercase">{item.categoria}</span>
                      <span className="text-white/10">·</span>
                      <span className="font-['Montserrat',sans-serif] text-[10px] text-white/20">Estoque: {item.estoque}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => setEditingShopItem(item)} className="p-2 rounded-lg hover:bg-[#d3b379]/10 text-white/30 hover:text-[#d3b379] transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteShopItem(item.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredShop.length === 0 && shopItems.length > 0 && (
                <div className="py-12 text-center">
                  <p className="font-['Montserrat',sans-serif] text-sm text-white/20">Nenhum item encontrado</p>
                  <p className="font-['Montserrat',sans-serif] text-xs text-white/10 mt-1">Tente ajustar os filtros</p>
                </div>
              )}
            </div>
          </TabSection>
          );
        })()}

        {activeTab === 'news' && (() => {
          const categorias = ['Todas', ...Array.from(new Set(newsList.map((n: any) => n.categoria).filter(Boolean)))];
          const filteredNews = newsList.filter((item: any) => {
            if (searchQuery && !item.titulo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterNewsCategoria !== 'Todas' && item.categoria !== filterNewsCategoria) return false;
            return true;
          });

          return (
          <TabSection
            title="Noticias"
            onAdd={() => setEditingNews({ titulo: '', resumo: '', conteudo: '', data: '', categoria: 'Institucional', imagem: '', destaque: false })}
            addLabel="Nova Noticia"
            empty={newsList.length === 0}
            emptyText="Nenhuma noticia cadastrada"
          >
            <AdminFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar noticia..."
              totalCount={newsList.length}
              filteredCount={filteredNews.length}
            >
              <FilterPills
                options={categorias}
                value={filterNewsCategoria}
                onChange={setFilterNewsCategoria}
              />
            </AdminFilterBar>

            <div className="space-y-2">
              {filteredNews.map((item: any) => (
                <div key={item.id} className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.025] transition-all duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-['Anton',sans-serif] text-white text-base tracking-wide truncate">{item.titulo}</span>
                      {item.destaque && (
                        <span className="px-1.5 py-0.5 rounded bg-[#d3b379]/15 text-[#d3b379] text-[8px] font-['Montserrat',sans-serif] tracking-wider uppercase shrink-0">Destaque</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-['Montserrat',sans-serif] text-[10px] text-white/25">{item.data}</span>
                      {item.categoria && (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-white/30 font-['Montserrat',sans-serif] text-[9px]">{item.categoria}</span>
                      )}
                    </div>
                    {item.resumo && (
                      <p className="font-['Montserrat',sans-serif] text-[10px] text-white/20 mt-1 truncate">{item.resumo}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <AdminButton onClick={() => setEditingNews(item)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </AdminButton>
                    <AdminButton onClick={() => deleteNews(item.id)} variant="danger">
                      <Trash2 className="w-3.5 h-3.5" />
                    </AdminButton>
                  </div>
                </div>
              ))}
              {filteredNews.length === 0 && newsList.length > 0 && (
                <div className="py-12 text-center">
                  <p className="font-['Montserrat',sans-serif] text-sm text-white/20">Nenhuma noticia encontrada</p>
                  <p className="font-['Montserrat',sans-serif] text-xs text-white/10 mt-1">Tente ajustar os filtros</p>
                </div>
              )}
            </div>
          </TabSection>
          );
        })()}

        {activeTab === 'sponsors' && (() => {
          const tipos = ['Todos', ...Array.from(new Set(sponsors.map((s: any) => s.tipo).filter(Boolean)))];
          const filteredSponsors = sponsors.filter((s: any) => {
            if (searchQuery && !s.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterSponsorTipo !== 'Todos' && s.tipo !== filterSponsorTipo) return false;
            return true;
          });
          return (
          <TabSection
            title="Patrocinadores"
            onAdd={() => setEditingSponsor({
              nome: '', tipo: 'Parceiro', descricao: '', logo: null, instagram: '', website: ''
            })}
            addLabel="Novo Parceiro"
            empty={sponsors.length === 0}
            emptyText="Nenhum patrocinador cadastrado"
          >
            {/* Filters */}
            <AdminFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar parceiro..."
              totalCount={sponsors.length}
              filteredCount={filteredSponsors.length}
            >
              <FilterPills
                options={tipos}
                value={filterSponsorTipo}
                onChange={setFilterSponsorTipo}
              />
            </AdminFilterBar>

            <div className="space-y-2">
              {filteredSponsors.map((sponsor: any) => (
                <div key={sponsor.id} className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.025] transition-all duration-200">
                  {/* Type badge */}
                  <div className="w-auto px-3 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="font-['Montserrat',sans-serif] text-[9px] font-semibold text-white/40 uppercase tracking-wider">{sponsor.tipo}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-['Montserrat',sans-serif] font-semibold text-white text-sm truncate">{sponsor.nome}</h3>
                    <p className="font-['Montserrat',sans-serif] text-[10px] text-white/25 truncate mt-0.5">{sponsor.descricao}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => setEditingSponsor(sponsor)} className="p-2 rounded-lg hover:bg-[#d3b379]/10 text-white/30 hover:text-[#d3b379] transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteSponsor(sponsor.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredSponsors.length === 0 && sponsors.length > 0 && (
                <div className="py-12 text-center">
                  <p className="font-['Montserrat',sans-serif] text-sm text-white/20">Nenhum parceiro encontrado</p>
                  <p className="font-['Montserrat',sans-serif] text-xs text-white/10 mt-1">Tente ajustar os filtros</p>
                </div>
              )}
            </div>
          </TabSection>
          );
        })()}

        {activeTab === 'settings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-['Anton',sans-serif] text-white text-2xl sm:text-3xl tracking-wide">CONFIGURAÇÕES</h2>
            </div>

            {/* Temporadas */}
            <div className="mb-8">
              <h3 className="font-['Anton',sans-serif] text-white text-lg tracking-wide mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#d3b379]" />
                Temporadas
              </h3>
              <p className="font-['Montserrat',sans-serif] text-white/30 text-xs mb-5">
                Gerencie as temporadas disponíveis. Ao adicionar uma nova, ela ficará disponível nos filtros e no cadastro de partidas em todo o site.
              </p>

              {/* Add new */}
              <div className="flex items-center gap-2 mb-5">
                <input
                  type="text"
                  placeholder="Ex: 2027"
                  value={newTemporada}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setNewTemporada(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTemporada.length === 4) addTemporada(newTemporada);
                  }}
                  maxLength={4}
                  className="bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2 text-white font-['Montserrat',sans-serif] text-sm w-28 focus:outline-none focus:ring-1 focus:ring-[#d3b379]/40 placeholder:text-white/15"
                />
                <AdminButton
                  onClick={() => {
                    if (newTemporada.length === 4) addTemporada(newTemporada);
                    else toast.error('Digite um ano válido (4 dígitos)');
                  }}
                  variant="gold"
                  disabled={newTemporada.length !== 4}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Temporada
                </AdminButton>
              </div>

              {/* Current temporadas */}
              <div className="flex flex-wrap gap-2">
                {temporadasList.map((t) => (
                  <div
                    key={t}
                    className="group flex items-center gap-2 bg-[#111] border border-white/[0.06] rounded-lg px-4 py-2.5 hover:border-[#d3b379]/20 transition-colors"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-[#d3b379]/60" />
                    <span className="text-white font-['Anton',sans-serif] text-lg tracking-wide">{t}</span>
                    <span className="text-white/20 font-['Montserrat',sans-serif] text-[10px]">
                      ({matchesList.filter((m: any) => m.temporada === t).length} jogos)
                    </span>
                    <button
                      onClick={() => deleteTemporada(t)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-red-500/10"
                      title={`Remover temporada ${t}`}
                    >
                      <X className="w-3 h-3 text-red-400/60 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              {temporadasList.length === 0 && (
                <p className="text-white/15 font-['Montserrat',sans-serif] text-xs mt-4">
                  Nenhuma temporada cadastrada. Adicione pelo menos uma.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.04] my-6" />

            {/* Info */}
            <div className="bg-[#111] border border-white/[0.04] rounded-xl p-5">
              <p className="font-['Montserrat',sans-serif] text-white/30 text-xs">
                <span className="text-[#d3b379]/60 font-semibold">Dica:</span> Treinadores são gerenciados na aba Jogadores (seção Comissão Técnica). Migrações de dados estão disponíveis no topo do painel.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Dialogs ═══ */}
      <PlayerEditDialog player={editingPlayer} onClose={() => setEditingPlayer(null)} onSave={savePlayer} onUploadPhoto={uploadPlayerPhoto} />
      <MatchEditDialog match={editingMatch} onClose={() => setEditingMatch(null)} onSave={saveMatch} onUploadLogo={uploadTeamLogo} players={playersList} allMatches={matchesList} coachesList={coachesList} temporadasList={temporadasList} />
      <ShopItemEditDialog item={editingShopItem} onClose={() => setEditingShopItem(null)} onSave={saveShopItem} onUploadImage={uploadGenericImage} />
      <SponsorEditDialog sponsor={editingSponsor} onClose={() => setEditingSponsor(null)} onSave={saveSponsor} onUploadImage={uploadGenericImage} />
      <NewsEditDialog news={editingNews} onClose={() => setEditingNews(null)} onSave={saveNews} onUploadImage={uploadGenericImage} />

      {/* Candidatos Selection Dialog */}
      {selectingCandidatosFor && (
        <Dialog open={true} onOpenChange={() => { setSelectingCandidatosFor(null); setSelectedCandidatos([]); }}>
          <DialogContent className="bg-[#0f0f0f] border-white/[0.08] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Anton',sans-serif] text-2xl text-white tracking-wide">
                Selecione 3 Candidatos ao Craque
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-white/40 font-['Roboto',sans-serif] text-sm">
                Escolha exatamente 3 jogadores que jogaram nesta partida para serem votados como craque da partida.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(selectingCandidatosFor.sumula || [])
                  .filter((s: any) => s.presente)
                  .map((s: any) => {
                    const player = playersList.find((p: any) => p.id === s.playerId);
                    if (!player) return null;
                    const isSelected = selectedCandidatos.includes(player.id);

                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCandidatos(selectedCandidatos.filter(id => id !== player.id));
                          } else if (selectedCandidatos.length < 3) {
                            setSelectedCandidatos([...selectedCandidatos, player.id]);
                          }
                        }}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'bg-[#d3b379]/15 border-[#d3b379]/40 ring-1 ring-[#d3b379]/30'
                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-['Anton',sans-serif] text-lg ${
                            isSelected ? 'bg-[#d3b379] text-[#0b0b0b]' : 'bg-white/[0.04] text-white/40'
                          }`}>
                            {player.numero}
                          </div>
                          <div className="flex-1">
                            <p className={`font-['Roboto',sans-serif] text-sm ${isSelected ? 'text-white' : 'text-white/60'}`}>
                              {player.nome}
                            </p>
                            <p className="font-['Roboto',sans-serif] text-[10px] text-white/30">
                              {player.posicao}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#d3b379] flex items-center justify-center">
                              <svg className="w-4 h-4 text-[#0b0b0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <p className="font-['Roboto',sans-serif] text-sm text-white/40">
                  {selectedCandidatos.length}/3 selecionados
                </p>
                <div className="flex gap-2">
                  <AdminButton
                    variant="ghost"
                    onClick={() => { setSelectingCandidatosFor(null); setSelectedCandidatos([]); }}
                  >
                    Cancelar
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    disabled={selectedCandidatos.length !== 3}
                    onClick={async () => {
                      try {
                        const res = await authFetch(`${API_BASE}/matches/${selectingCandidatosFor.id}/open-voting`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ candidatos: selectedCandidatos }),
                        });
                        if (res.ok) {
                          toast.success('Votação aberta com 3 candidatos!');
                          await loadMatches();
                          setSelectingCandidatosFor(null);
                          setSelectedCandidatos([]);
                        } else {
                          const err = await res.json();
                          toast.error(err.error || 'Erro ao abrir votação');
                        }
                      } catch (err) {
                        toast.error('Erro ao abrir votação');
                      }
                    }}
                  >
                    <Trophy className="w-4 h-4" />
                    Abrir Votação
                  </AdminButton>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab Section wrapper
   ═══════════════════════════════════════════ */
function TabSection({ title, onAdd, addLabel, children, empty, emptyText }: {
  title: string; onAdd: () => void; addLabel: string; children: React.ReactNode; empty: boolean; emptyText: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-['Anton',sans-serif] text-white text-2xl sm:text-3xl tracking-wide">{title.toUpperCase()}</h2>
        <AdminButton onClick={onAdd} variant="primary">
          <Plus className="w-3.5 h-3.5" />
          {addLabel}
        </AdminButton>
      </div>
      {empty ? (
        <div className="py-16 text-center">
          <p className="font-['Montserrat',sans-serif] text-sm text-white/20">{emptyText}</p>
          <p className="font-['Montserrat',sans-serif] text-xs text-white/10 mt-1">Use "Migrar Dados" para importar dados iniciais</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Shared Dialog Styles
   ═══════════════════════════════════════════ */
const dialogContentClass = "max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0e0e0e] border border-white/[0.06] text-white rounded-2xl shadow-2xl shadow-black/50";
const dialogTitleClass = "font-['Anton',sans-serif] text-2xl text-white tracking-wide";
const labelClass = "font-['Montserrat',sans-serif] text-[10px] tracking-[0.15em] uppercase text-white/40 font-semibold";
const inputClass = "bg-[#0b0b0b] border-white/[0.06] text-white rounded-lg font-['Montserrat',sans-serif] text-sm focus:border-[#d3b379]/50 focus:ring-1 focus:ring-[#d3b379]/20 placeholder:text-white/15 transition-all";
const selectTriggerClass = "bg-[#0b0b0b] border-white/[0.06] text-white rounded-lg font-['Montserrat',sans-serif] text-sm";
const selectContentClass = "bg-[#111] border-white/[0.08] rounded-lg";

function DialogActions({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  return (
    <div className="flex gap-2 pt-6 border-t border-white/[0.04]">
      <button onClick={onSave} className="flex-1 px-5 py-2.5 bg-[#d3b379] text-[#0b0b0b] font-['Montserrat',sans-serif] text-[10px] tracking-[0.15em] uppercase rounded-lg hover:bg-[#c4a265] transition-all flex items-center justify-center gap-2 font-bold shadow-[0_0_20px_rgba(211,179,121,0.15)]">
        <Save className="w-3.5 h-3.5" /> Salvar
      </button>
      <button onClick={onClose} className="px-5 py-2.5 border border-white/[0.08] text-white/50 hover:text-white hover:border-white/[0.15] transition-all font-['Montserrat',sans-serif] text-[10px] tracking-[0.15em] uppercase rounded-lg flex items-center gap-2">
        <X className="w-3.5 h-3.5" /> Cancelar
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Birthday Input — DD / MM / AAAA with visual feedback
   ═══════════════════════════════════════════ */
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function BirthdayInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = value ? value.split('/') : ['', '', ''];
  const day = parts[0] || '';
  const month = parts[1] || '';
  const year = parts[2] || '';

  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  function buildDate(d: string, m: string, y: string) {
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    if (!d && !m && !y) return '';
    return `${dd}/${mm}/${y}`;
  }

  function handleDayChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(v) > 31) v = '31';
    onChange(buildDate(v, month, year));
  }

  function handleYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    onChange(buildDate(day, month, v));
  }

  function handleMonthSelect(m: number) {
    const mm = String(m).padStart(2, '0');
    onChange(buildDate(day, mm, year));
  }

  const age = (() => {
    if (!day || !month || !year || year.length < 4) return null;
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    const now = new Date();
    let a = now.getFullYear() - y;
    if (now < new Date(now.getFullYear(), m - 1, d)) a--;
    return a >= 0 && a < 120 ? a : null;
  })();

  const daysUntil = (() => {
    if (!day || !month || year.length < 4) return null;
    const d = parseInt(day);
    const m = parseInt(month);
    if (isNaN(d) || isNaN(m)) return null;
    const now = new Date();
    let next = new Date(now.getFullYear(), m - 1, d);
    if (next.getTime() < now.getTime() - 86400000) {
      next = new Date(now.getFullYear() + 1, m - 1, d);
    }
    const diff = Math.ceil((next.getTime() - now.getTime()) / 86400000);
    return diff;
  })();

  const monthNum = parseInt(month);

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-end">
        {/* Day */}
        <div className="w-[72px] space-y-1.5">
          <span className="font-['Montserrat',sans-serif] text-[9px] text-white/25 tracking-wider uppercase block">Dia</span>
          <input
            ref={dayRef}
            type="text"
            inputMode="numeric"
            value={day}
            onChange={handleDayChange}
            onFocus={(e) => e.target.select()}
            maxLength={2}
            placeholder="DD"
            className="w-full h-10 text-center font-['Anton',sans-serif] text-lg bg-[#0b0b0b] border border-white/[0.06] text-white rounded-lg focus:border-[#d3b379]/50 focus:ring-1 focus:ring-[#d3b379]/20 placeholder:text-white/10 transition-all outline-none"
          />
        </div>

        <span className="font-['Anton',sans-serif] text-white/15 text-lg pb-2">/</span>

        {/* Month */}
        <div className="flex-1 space-y-1.5">
          <span className="font-['Montserrat',sans-serif] text-[9px] text-white/25 tracking-wider uppercase block">Mes</span>
          <div className="relative">
            <select
              value={monthNum > 0 ? monthNum : ''}
              onChange={(e) => handleMonthSelect(parseInt(e.target.value) || 0)}
              className="w-full h-10 appearance-none bg-[#0b0b0b] border border-white/[0.06] text-white rounded-lg px-3 pr-8 font-['Montserrat',sans-serif] text-sm focus:border-[#d3b379]/50 focus:ring-1 focus:ring-[#d3b379]/20 transition-all outline-none cursor-pointer"
            >
              <option value="" className="bg-[#111]">Selecionar</option>
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1} className="bg-[#111]">{name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
          </div>
        </div>

        <span className="font-['Anton',sans-serif] text-white/15 text-lg pb-2">/</span>

        {/* Year */}
        <div className="w-[90px] space-y-1.5">
          <span className="font-['Montserrat',sans-serif] text-[9px] text-white/25 tracking-wider uppercase block">Ano</span>
          <input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            value={year}
            onChange={handleYearChange}
            onFocus={(e) => e.target.select()}
            maxLength={4}
            placeholder="AAAA"
            className="w-full h-10 text-center font-['Anton',sans-serif] text-lg bg-[#0b0b0b] border border-white/[0.06] text-white rounded-lg focus:border-[#d3b379]/50 focus:ring-1 focus:ring-[#d3b379]/20 placeholder:text-white/10 transition-all outline-none"
          />
        </div>
      </div>

      {/* Info badges */}
      {(age !== null || daysUntil !== null) && (
        <div className="flex items-center gap-2 flex-wrap">
          {age !== null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <Cake className="w-3 h-3 text-[#d3b379]/60" />
              <span className="font-['Montserrat',sans-serif] text-[10px] text-white/40">{age} anos</span>
            </span>
          )}
          {daysUntil !== null && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              daysUntil <= 7
                ? 'bg-[#d3b379]/[0.06] border-[#d3b379]/20'
                : 'bg-white/[0.03] border-white/[0.05]'
            }`}>
              <Calendar className={`w-3 h-3 ${daysUntil <= 7 ? 'text-[#d3b379]' : 'text-white/25'}`} />
              <span className={`font-['Montserrat',sans-serif] text-[10px] ${
                daysUntil === 0 ? 'text-[#d3b379] font-bold' : daysUntil <= 7 ? 'text-[#d3b379]/70' : 'text-white/30'
              }`}>
                {daysUntil === 0 ? 'Hoje!' : daysUntil === 1 ? 'Amanha!' : `em ${daysUntil} dias`}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Player Edit Dialog
   ═══════════════════════════════════════════ */
function PlayerEditDialog({ player, onClose, onSave, onUploadPhoto }: any) {
  const [formData, setFormData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setFormData({
        ...player,
        stats: player.stats || {
          '2024': { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
          '2025': { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
          '2026': { jogos: 0, gols: 0, assistencias: 0, mvp: 0 }
        }
      });
    }
  }, [player]);

  if (!player || !formData) return null;

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são aceitas');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (max 5MB)');
      return;
    }
    setUploading(true);
    const url = await onUploadPhoto(formData.id || 'new', file);
    if (url) setFormData({ ...formData, foto: url });
    setUploading(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  // Stats are now computed automatically from sumula data

  return (
    <Dialog open={!!player} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>
            {formData.id ? 'Editar Jogador' : 'Novo Jogador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Nome</Label>
              <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Posição</Label>
              <Select value={formData.posicao} onValueChange={(v) => setFormData({ ...formData, posicao: v })}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos} className="text-white font-['Montserrat',sans-serif] text-sm">{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Número</Label>
              <Input
                inputMode="numeric"
                value={formData.numero != null && formData.numero !== '' ? String(formData.numero) : ''}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, numero: v === '' ? '' : parseInt(v) });
                }}
                onBlur={() => {
                  if (formData.numero === '' || formData.numero == null) setFormData({ ...formData, numero: 0 });
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Instagram</Label>
              <Input value={formData.instagram || ''} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="username" className={inputClass} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Data de Nascimento</Label>
            <BirthdayInput
              value={formData.aniversario || ''}
              onChange={(v) => setFormData({ ...formData, aniversario: v })}
            />
          </div>

          {/* Status toggle */}
          {formData.id && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {formData.ativo !== false ? (
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <UserX className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <p className="font-['Montserrat',sans-serif] text-xs font-semibold text-white/80">
                      {formData.ativo !== false ? 'Jogador Ativo' : 'Jogador Inativo'}
                    </p>
                    <p className="font-['Montserrat',sans-serif] text-[10px] text-white/30">
                      {formData.ativo !== false ? 'Aparece no elenco público' : 'Não aparece no site público'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ativo: formData.ativo === false ? true : false, exJogador: false })}
                  className={`relative w-10 h-6 rounded-full transition-all duration-300 cursor-pointer ${
                    formData.ativo !== false
                      ? 'bg-emerald-500/30 border border-emerald-500/40'
                      : 'bg-white/[0.06] border border-white/[0.1]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all duration-300 shadow ${
                    formData.ativo !== false
                      ? 'left-[18px] bg-emerald-400'
                      : 'left-0.5 bg-white/30'
                  }`} />
                </button>
              </div>

              {/* Ex-Jogador toggle — only visible when inactive */}
              {formData.ativo === false && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#d3b379]/[0.03] border border-[#d3b379]/10">
                  <div className="flex items-center gap-2.5">
                    <Trophy className={`w-4 h-4 ${formData.exJogador ? 'text-[#d3b379]' : 'text-white/20'}`} />
                    <div>
                      <p className="font-['Montserrat',sans-serif] text-xs font-semibold text-white/80">
                        {formData.exJogador ? 'Ex-Jogador do Clube' : 'Marcar como Ex-Jogador'}
                      </p>
                      <p className="font-['Montserrat',sans-serif] text-[10px] text-white/30">
                        {formData.exJogador ? 'Aparece em "Passaram pelo Clube"' : 'Ficará visível na seção de ex-jogadores'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, exJogador: !formData.exJogador })}
                    className={`relative w-10 h-6 rounded-full transition-all duration-300 cursor-pointer ${
                      formData.exJogador
                        ? 'bg-[#d3b379]/30 border border-[#d3b379]/40'
                        : 'bg-white/[0.06] border border-white/[0.1]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all duration-300 shadow ${
                      formData.exJogador
                        ? 'left-[18px] bg-[#d3b379]'
                        : 'left-0.5 bg-white/30'
                    }`} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className={labelClass}>Foto do Jogador</Label>
            <div className="flex gap-5 items-start">
              {/* Photo Preview */}
              <div className="relative shrink-0">
                <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                  formData.foto 
                    ? 'border-[#d3b379]/30 shadow-[0_0_20px_rgba(211,179,121,0.1)]' 
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}>
                  {formData.foto ? (
                    <img src={formData.foto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                      <Camera className="w-6 h-6 text-white/15" />
                      <span className="font-['Montserrat',sans-serif] text-[8px] text-white/20 tracking-wider uppercase">Sem foto</span>
                    </div>
                  )}
                </div>
                {formData.foto && (
                  <button
                    onClick={() => setFormData({ ...formData, foto: null })}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors shadow-lg"
                    title="Remover foto"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`flex-1 relative cursor-pointer rounded-xl border-2 border-dashed p-5 transition-all duration-300 ${
                  uploading
                    ? 'border-[#d3b379]/30 bg-[#d3b379]/[0.03]'
                    : dragOver
                      ? 'border-[#d3b379]/60 bg-[#d3b379]/[0.06] scale-[1.01]'
                      : 'border-white/[0.08] bg-white/[0.01] hover:border-white/[0.15] hover:bg-white/[0.02]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2.5 text-center">
                  {uploading ? (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[#d3b379]/10 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[#d3b379] animate-spin" />
                      </div>
                      <div>
                        <p className="font-['Montserrat',sans-serif] text-xs font-semibold text-[#d3b379]">Enviando...</p>
                        <p className="font-['Montserrat',sans-serif] text-[10px] text-white/25 mt-0.5">Aguarde o upload</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        dragOver ? 'bg-[#d3b379]/15' : 'bg-white/[0.04]'
                      }`}>
                        <Upload className={`w-5 h-5 transition-colors ${dragOver ? 'text-[#d3b379]' : 'text-white/25'}`} />
                      </div>
                      <div>
                        <p className="font-['Montserrat',sans-serif] text-xs font-semibold text-white/60">
                          {dragOver ? 'Solte para enviar' : 'Arraste uma imagem aqui'}
                        </p>
                        <p className="font-['Montserrat',sans-serif] text-[10px] text-white/20 mt-0.5">
                          ou <span className="text-[#d3b379]/60 underline underline-offset-2">clique para selecionar</span>
                        </p>
                        <p className="font-['Montserrat',sans-serif] text-[9px] text-white/10 mt-1.5">PNG, JPG ou WEBP · Max 5MB</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info: stats are computed from sumula */}
          <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.04]">
            <p className="font-['Montserrat',sans-serif] text-[10px] text-white/25">
              <span className="text-[#d3b379]/50 font-semibold">ℹ️ Estatísticas:</span> As stats dos jogadores são calculadas automaticamente a partir das súmulas das partidas. Para atualizar, edite a súmula na aba de Partidas.
            </p>
          </div>

          <DialogActions onSave={() => onSave(formData)} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   Match Edit Dialog
   ═══════════════════════════════════════════ */
function MatchEditDialog({ match, onClose, onSave, onUploadLogo, players, allMatches = [], coachesList = [], temporadasList = DEFAULT_TEMPORADAS }: any) {
  const [formData, setFormData] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const [sumulaOpen, setSumulaOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [showLocalSuggestions, setShowLocalSuggestions] = useState(false);
  const [showCompSuggestions, setShowCompSuggestions] = useState(false);
  const [advPopoverOpen, setAdvPopoverOpen] = useState(false);
  const [sumulaFilter, setSumulaFilter] = useState<'Todos' | 'Ativos' | 'Inativos'>('Todos');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const localRef = useRef<HTMLDivElement>(null);
  const compRef = useRef<HTMLDivElement>(null);

  // Build known teams list from all previous matches
  const knownTeams = useMemo(() => {
    const teamsMap = new Map<string, { name: string; logo: string | null }>();
    (allMatches || []).forEach((m: any) => {
      const adv = m.equipeCasa === 'Sadock FC' ? m.equipeFora : m.equipeCasa;
      if (adv && adv !== 'Sadock FC') {
        const existing = teamsMap.get(adv);
        if (!existing || (!existing.logo && m.adversarioLogo)) {
          teamsMap.set(adv, { name: adv, logo: m.adversarioLogo || null });
        }
      }
    });
    return Array.from(teamsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allMatches]);

  // Filtered teams by search
  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return knownTeams;
    const q = teamSearch.toLowerCase();
    return knownTeams.filter((t) => t.name.toLowerCase().includes(q));
  }, [knownTeams, teamSearch]);

  // Build unique locals and competitions from previous matches
  const knownLocals = useMemo(() => {
    const set = new Set<string>();
    (allMatches || []).forEach((m: any) => { if (m.local?.trim()) set.add(m.local.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allMatches]);

  const knownComps = useMemo(() => {
    const set = new Set<string>();
    (allMatches || []).forEach((m: any) => { if (m.competicao?.trim()) set.add(m.competicao.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allMatches]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (localRef.current && !localRef.current.contains(e.target as Node)) setShowLocalSuggestions(false);
      if (compRef.current && !compRef.current.contains(e.target as Node)) setShowCompSuggestions(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (match) {
      // Auto-initialize sumula with all players when opening
      const existingSumula: PlayerMatchStat[] = match.sumula || [];
      const sumulaMap = new Map(existingSumula.map((s: PlayerMatchStat) => [s.playerId, s]));
      const fullSumula = (players || []).map((p: any) => {
        const existing = sumulaMap.get(p.id);
        return existing || {
          playerId: p.id,
          presente: false,
          gols: 0,
          assistencias: 0,
          defesas: 0,
          mvp: false,
        };
      });
      // Migrate old coachPresente boolean to coachesPresentes array
      let coachesPresentes = match.coachesPresentes || [];
      if (!match.coachesPresentes && match.coachPresente && coachesList.length > 0) {
        // Old format: coachPresente=true meant the current coach was present
        const currentCoach = coachesList.find((c: any) => c.atual);
        if (currentCoach) coachesPresentes = [currentCoach.id];
      }
      setFormData({ ...match, sumula: fullSumula.length > 0 ? fullSumula : match.sumula, coachesPresentes });
      setSumulaOpen(true);
      setSumulaFilter('Todos'); // Reset filter when opening a new match
    }
  }, [match]);

  if (!match || !formData) return null;

  async function processLogoFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são aceitas');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (max 5MB)');
      return;
    }
    setUploadingLogo(true);
    const teamName = (formData.equipeFora || formData.equipeCasa || 'team').replace(/\s+/g, '_').toLowerCase();
    const url = await onUploadLogo(teamName, file);
    if (url) setFormData({ ...formData, adversarioLogo: url });
    setUploadingLogo(false);
  }

  function handleLogoDrop(e: React.DragEvent) {
    e.preventDefault();
    setLogoDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  }

  // Determine adversario name for display
  const advName = formData.equipeCasa === 'Sadock FC' ? (formData.equipeFora || 'Adversário') : (formData.equipeCasa || 'Adversário');

  return (
    <Dialog open={!!match} onOpenChange={onClose}>
      <DialogContent className="max-w-[96vw] w-[1300px] max-h-[92vh] bg-[#0e0e0e] border border-white/[0.06] text-white rounded-2xl shadow-2xl shadow-black/50 p-0 overflow-hidden flex flex-col">
        {/* ── Header ── */}
        <div className="px-8 pt-6 pb-4 border-b border-white/[0.04] shrink-0">
          <DialogHeader>
            <DialogTitle className={dialogTitleClass}>
              {formData.id ? 'Editar Partida' : 'Nova Partida'}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* ═══ Two-Column Layout ═══ */}
        <div className="flex-1 grid grid-cols-[minmax(320px,0.8fr)_minmax(500px,1.2fr)] divide-x divide-white/[0.06] overflow-hidden min-h-0">

          {/* ──── LEFT: Detalhes da Partida ──── */}
          <div className="p-6 space-y-5 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(211,179,121,0.15) transparent' }}>

            {/* Adversário picker (compact) */}
            <div className="space-y-2">
              <Label className={labelClass}>Adversário</Label>
              <div className="flex items-center gap-3">
                {/* Escudo preview */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 flex items-center justify-center transition-all ${formData.adversarioLogo ? 'border-white/[0.1] bg-white/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                    {formData.adversarioLogo ? <img src={formData.adversarioLogo} alt={advName} className="w-full h-full object-contain p-1" /> : <Shield className="w-5 h-5 text-white/10" />}
                  </div>
                  {formData.adversarioLogo && (
                    <button type="button" onClick={() => setFormData({ ...formData, adversarioLogo: null })} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors shadow-lg"><X className="w-2.5 h-2.5 text-white" /></button>
                  )}
                </div>
                {/* Team name + dropdown toggle */}
                <div className="flex-1 min-w-0 relative">
                  <button type="button" onClick={() => setAdvPopoverOpen(!advPopoverOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer">
                    <span className="font-['Montserrat',sans-serif] text-sm font-medium text-white truncate">{advName}</span>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${advPopoverOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {/* Dropdown */}
                  {advPopoverOpen && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#161616] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-2 border-b border-white/[0.04]">
                        <div className="relative">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                          <Input value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} placeholder="Buscar time..." className={`${inputClass} pl-8 h-8 text-xs`} autoFocus />
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(211,179,121,0.15) transparent' }}>
                        {filteredTeams.map((team) => {
                          const isAdv = formData.equipeCasa === 'Sadock FC' ? formData.equipeFora === team.name : formData.equipeCasa === team.name;
                          return (
                            <button key={team.name} type="button"
                              onClick={() => { const isCasa = formData.equipeCasa === 'Sadock FC' || !formData.equipeCasa; setFormData({ ...formData, ...(isCasa ? { equipeFora: team.name } : { equipeCasa: team.name }), adversarioLogo: team.logo || formData.adversarioLogo }); setAdvPopoverOpen(false); setTeamSearch(''); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-['Montserrat',sans-serif] font-medium transition-all cursor-pointer ${isAdv ? 'bg-[#d3b379]/15 text-[#d3b379]' : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'}`}
                            >
                              {team.logo ? <img src={team.logo} alt={team.name} className="w-5 h-5 rounded object-contain shrink-0" /> : <Shield className="w-4 h-4 opacity-30 shrink-0" />}
                              <span className="truncate">{team.name}</span>
                            </button>
                          );
                        })}
                        {filteredTeams.length === 0 && <p className="text-center text-white/20 font-['Montserrat',sans-serif] text-[11px] py-4">Nenhum time encontrado</p>}
                      </div>
                    </div>
                  )}
                </div>
                {/* Upload escudo */}
                <div
                  onDrop={handleLogoDrop} onDragOver={(e) => { e.preventDefault(); setLogoDragOver(true); }} onDragLeave={(e) => { e.preventDefault(); setLogoDragOver(false); }}
                  onClick={() => !uploadingLogo && logoInputRef.current?.click()}
                  className={`shrink-0 relative cursor-pointer rounded-lg border-2 border-dashed w-12 h-12 flex items-center justify-center transition-all ${uploadingLogo ? 'border-[#d3b379]/30 bg-[#d3b379]/[0.03]' : logoDragOver ? 'border-[#d3b379]/60 bg-[#d3b379]/[0.06]' : 'border-white/[0.08] bg-white/[0.01] hover:border-white/[0.15]'}`}
                  title="Upload escudo"
                >
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) processLogoFile(f); }} disabled={uploadingLogo} className="hidden" />
                  {uploadingLogo ? <Loader2 className="w-4 h-4 text-[#d3b379] animate-spin" /> : <Upload className={`w-4 h-4 ${logoDragOver ? 'text-[#d3b379]' : 'text-white/20'}`} />}
                </div>
              </div>
            </div>

            {/* Data / Horário / Temporada */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className={labelClass}>Data</Label>
                <div className="relative">
                  <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  <Input value={formData.data || ''} onChange={(e) => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 8) v = v.slice(0, 8); if (v.length >= 5) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4); else if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2); setFormData({ ...formData, data: v }); }} placeholder="DD/MM/AAAA" maxLength={10} className={`${inputClass} pl-9 tabular-nums tracking-wider text-sm h-10`} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Horário</Label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  <Input value={formData.horario || ''} onChange={(e) => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 4) v = v.slice(0, 4); if (v.length >= 3) v = v.slice(0, 2) + ':' + v.slice(2); setFormData({ ...formData, horario: v }); }} placeholder="HH:MM" maxLength={5} className={`${inputClass} pl-9 tabular-nums tracking-wider text-sm h-10`} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Temporada</Label>
                <Select value={formData.temporada || '2026'} onValueChange={(v) => setFormData({ ...formData, temporada: v })}>
                  <SelectTrigger className={`${selectTriggerClass} h-10`}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    {temporadasList.map((t) => (<SelectItem key={t} value={t} className="text-white font-['Montserrat',sans-serif] text-sm">{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Placar */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Label className={`${labelClass} mb-3 block`}>Placar</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Input value={formData.equipeCasa || ''} onChange={(e) => setFormData({ ...formData, equipeCasa: e.target.value })} placeholder="Sadock FC" className={`${inputClass} text-center text-sm h-10`} />
                  {!formData.wo && (
                    <Input inputMode="numeric" value={formData.placarCasa != null && formData.placarCasa !== '' ? String(formData.placarCasa) : ''} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setFormData({ ...formData, placarCasa: v === '' ? '' : parseInt(v) }); }} onBlur={() => { if (formData.placarCasa === '' || formData.placarCasa == null) setFormData({ ...formData, placarCasa: 0 }); }} onFocus={(e) => e.target.select()} placeholder="0" className={`${inputClass} text-center font-['Anton',sans-serif] text-2xl h-12`} />
                  )}
                </div>
                <span className="font-['Anton',sans-serif] text-2xl text-white/20 pb-2">{formData.wo ? 'W.O.' : '×'}</span>
                <div className="flex-1 space-y-2">
                  <Input value={formData.equipeFora || ''} onChange={(e) => setFormData({ ...formData, equipeFora: e.target.value })} placeholder="Adversário" className={`${inputClass} text-center text-sm h-10`} />
                  {!formData.wo && (
                    <Input inputMode="numeric" value={formData.placarFora != null && formData.placarFora !== '' ? String(formData.placarFora) : ''} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setFormData({ ...formData, placarFora: v === '' ? '' : parseInt(v) }); }} onBlur={() => { if (formData.placarFora === '' || formData.placarFora == null) setFormData({ ...formData, placarFora: 0 }); }} onFocus={(e) => e.target.select()} placeholder="0" className={`${inputClass} text-center font-['Anton',sans-serif] text-2xl h-12`} />
                  )}
                </div>
              </div>
            </div>

            {/* W.O. */}
            <div className={`p-4 rounded-xl border transition-all duration-200 ${formData.wo ? 'bg-red-500/[0.04] border-red-500/20' : 'bg-white/[0.015] border-white/[0.04]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.wo ? 'bg-red-500/15' : 'bg-white/[0.04]'}`}>
                    <Ban className={`w-4 h-4 ${formData.wo ? 'text-red-400' : 'text-white/25'}`} />
                  </div>
                  <p className="font-['Montserrat',sans-serif] text-xs font-semibold text-white">W.O. (Walkover)</p>
                </div>
                <button type="button" onClick={() => { const newWo = !formData.wo; setFormData({ ...formData, wo: newWo, woTipo: newWo ? (formData.woTipo || 'sadock') : formData.woTipo, placarCasa: newWo ? 0 : formData.placarCasa, placarFora: newWo ? 0 : formData.placarFora }); }}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer ${formData.wo ? 'bg-red-500/60' : 'bg-white/[0.08] hover:bg-white/[0.12]'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${formData.wo ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {formData.wo && (
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex gap-2">
                  <button type="button" onClick={() => setFormData({ ...formData, woTipo: 'sadock' })} className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-['Montserrat',sans-serif] font-semibold border cursor-pointer ${formData.woTipo === 'sadock' ? 'bg-emerald-400/10 border-emerald-400/25 text-emerald-400' : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50'}`}>Sadock venceu</button>
                  <button type="button" onClick={() => setFormData({ ...formData, woTipo: 'adversario' })} className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-['Montserrat',sans-serif] font-semibold border cursor-pointer ${formData.woTipo === 'adversario' ? 'bg-red-400/10 border-red-400/25 text-red-400' : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50'}`}>Adversário venceu</button>
                </div>
              )}
            </div>

            {/* Local + Competição */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5" ref={localRef}>
                <Label className={labelClass}>Local</Label>
                <div className="relative">
                  <Input value={formData.local || ''} onChange={(e) => { setFormData({ ...formData, local: e.target.value }); setShowLocalSuggestions(true); }} onFocus={() => setShowLocalSuggestions(true)} placeholder="Digite ou selecione..." className={`${inputClass} text-sm h-10`} />
                  {showLocalSuggestions && (() => { const q = (formData.local || '').toLowerCase(); const filtered = knownLocals.filter((l) => l.toLowerCase().includes(q) && l !== formData.local); if (filtered.length === 0) return null; return (<div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#1a1a1a] border border-white/[0.1] rounded-lg shadow-xl max-h-[140px] overflow-y-auto">{filtered.map((loc) => (<button key={loc} type="button" onClick={() => { setFormData({ ...formData, local: loc }); setShowLocalSuggestions(false); }} className="w-full text-left px-3 py-2 text-xs font-['Montserrat',sans-serif] text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer truncate">{loc}</button>))}</div>); })()}
                </div>
              </div>
              <div className="space-y-1.5" ref={compRef}>
                <Label className={labelClass}>Competição</Label>
                <div className="relative">
                  <Input value={formData.competicao || ''} onChange={(e) => { setFormData({ ...formData, competicao: e.target.value }); setShowCompSuggestions(true); }} onFocus={() => setShowCompSuggestions(true)} placeholder="Digite ou selecione..." className={`${inputClass} text-sm h-10`} />
                  {showCompSuggestions && (() => { const q = (formData.competicao || '').toLowerCase(); const filtered = knownComps.filter((c) => c.toLowerCase().includes(q) && c !== formData.competicao); if (filtered.length === 0) return null; return (<div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#1a1a1a] border border-white/[0.1] rounded-lg shadow-xl max-h-[140px] overflow-y-auto">{filtered.map((comp) => (<button key={comp} type="button" onClick={() => { setFormData({ ...formData, competicao: comp }); setShowCompSuggestions(false); }} className="w-full text-left px-3 py-2 text-xs font-['Montserrat',sans-serif] text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer truncate">{comp}</button>))}</div>); })()}
                </div>
              </div>
            </div>
          </div>

          {/* ──── RIGHT: Súmula do Jogo ──── */}
          <div className="flex flex-col overflow-hidden bg-white/[0.01]">
            {players && players.length > 0 ? (
              <>
                {/* Súmula Header */}
                <div className="px-5 py-4 bg-white/[0.02] border-b border-white/[0.04] flex items-center gap-3 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-[#d3b379]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#d3b379]" />
                  </div>
                  <div>
                    <p className="font-['Montserrat',sans-serif] text-sm font-semibold text-white">Súmula do Jogo</p>
                    <p className="font-['Montserrat',sans-serif] text-[10px] text-white/30">Presença, gols, assistências e desempenho</p>
                  </div>
                </div>

                {/* Filter */}
                <div className="px-5 py-3 bg-white/[0.01] border-b border-white/[0.04] shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold mr-2">Filtro:</span>
                    {(['Todos', 'Ativos', 'Inativos'] as const).map((filterOption) => (
                      <button
                        key={filterOption}
                        type="button"
                        onClick={() => setSumulaFilter(filterOption)}
                        className={`px-3 py-1.5 rounded-lg font-['Montserrat',sans-serif] text-[10px] tracking-[0.1em] uppercase font-medium transition-all duration-200 ${
                          sumulaFilter === filterOption
                            ? 'bg-[#d3b379] text-[#0b0b0b] shadow-[0_0_10px_rgba(211,179,121,0.3)]'
                            : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60 border border-white/[0.06]'
                        }`}
                      >
                        {filterOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_50px_50px_50px_50px_36px] gap-1 px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.04] shrink-0">
                  <span className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold">Jogador</span>
                  <span className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold text-center">Gols</span>
                  <span className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold text-center">Asst</span>
                  <span className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold text-center">Def</span>
                  <span className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase text-white/30 font-semibold text-center">MVP</span>
                  <span />
                </div>

                {/* Scrollable player rows */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(211,179,121,0.15) transparent' }}>
                  {formData.sumula && (<>
                    {(() => {
                      const posOrder: Record<string, number> = { 'Goleiro': 0, 'Fixo': 1, 'Ala': 2, 'Meio': 3, 'Pivô': 4 };

                      // Filter by status
                      let filteredPlayers = [...players].filter((p: any) => p.posicao !== 'Técnico');
                      if (sumulaFilter === 'Ativos') {
                        filteredPlayers = filteredPlayers.filter((p: any) => p.ativo !== false);
                      } else if (sumulaFilter === 'Inativos') {
                        filteredPlayers = filteredPlayers.filter((p: any) => p.ativo === false);
                      }

                      // Sort: presentes first, then by position
                      return filteredPlayers.sort((a: any, b: any) => {
                        const aIdx = formData.sumula.findIndex((s: PlayerMatchStat) => s.playerId === a.id);
                        const bIdx = formData.sumula.findIndex((s: PlayerMatchStat) => s.playerId === b.id);
                        const aPresente = aIdx !== -1 && formData.sumula[aIdx].presente;
                        const bPresente = bIdx !== -1 && formData.sumula[bIdx].presente;

                        // Presentes first
                        if (aPresente && !bPresente) return -1;
                        if (!aPresente && bPresente) return 1;

                        // Then by position
                        return (posOrder[a.posicao] ?? 99) - (posOrder[b.posicao] ?? 99);
                      });
                    })().map((player: any) => {
                      const idx = formData.sumula.findIndex((s: PlayerMatchStat) => s.playerId === player.id);
                      if (idx === -1) return null;
                      const stat = formData.sumula[idx];
                      const isGoleiro = player.posicao === 'Goleiro';

                      const updateStat = (field: string, value: any) => {
                        const newSumula = [...formData.sumula];
                        newSumula[idx] = { ...newSumula[idx], [field]: value };
                        setFormData({ ...formData, sumula: newSumula });
                      };

                      return (
                        <div
                          key={player.id}
                          className={`grid grid-cols-[1fr_50px_50px_50px_50px_36px] gap-1 px-5 py-2 items-center border-b border-white/[0.03] transition-all duration-200 ${
                            stat.presente ? 'bg-white/[0.02]' : 'opacity-40'
                          }`}
                        >
                          {/* Player name + position */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => updateStat('presente', !stat.presente)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                                stat.presente
                                  ? 'bg-[#d3b379] border-[#d3b379]'
                                  : 'border-white/[0.12] hover:border-white/[0.25]'
                              }`}
                            >
                              {stat.presente && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="#0b0b0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <div className="min-w-0 overflow-hidden">
                              <div className="flex items-center gap-1.5">
                                <span className="font-['Anton',sans-serif] text-[10px] text-[#d3b379]/50 shrink-0">#{player.numero}</span>
                                <span className="font-['Montserrat',sans-serif] text-[13px] font-medium text-white truncate">{player.nome}</span>
                              </div>
                              <span className={`font-['Montserrat',sans-serif] text-[9px] tracking-wider uppercase ${
                                isGoleiro ? 'text-emerald-400/40' : 'text-white/20'
                              }`}>{player.posicao}</span>
                            </div>
                          </div>

                          {/* Gols */}
                          <div className="flex justify-center">
                            <SumulaCounter value={stat.gols} onChange={(v: number) => updateStat('gols', v)} disabled={!stat.presente} accent="text-white" />
                          </div>

                          {/* Assistências */}
                          <div className="flex justify-center">
                            <SumulaCounter value={stat.assistencias} onChange={(v: number) => updateStat('assistencias', v)} disabled={!stat.presente} accent="text-white" />
                          </div>

                          {/* Defesas */}
                          <div className="flex justify-center">
                            {isGoleiro ? (
                              <SumulaCounter value={stat.defesas} onChange={(v: number) => updateStat('defesas', v)} disabled={!stat.presente} accent="text-emerald-400" />
                            ) : (
                              <span className="text-white/10 text-[10px]">—</span>
                            )}
                          </div>

                          {/* MVP */}
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (!stat.presente) return;
                                const newSumula = formData.sumula.map((s: PlayerMatchStat) => ({
                                  ...s,
                                  mvp: s.playerId === player.id ? !stat.mvp : false,
                                }));
                                setFormData({ ...formData, sumula: newSumula });
                              }}
                              disabled={!stat.presente}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                stat.mvp
                                  ? 'bg-amber-400/20 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.15)]'
                                  : stat.presente
                                    ? 'hover:bg-white/[0.04] text-white/15 hover:text-white/30'
                                    : 'text-white/5'
                              }`}
                              title="MVP da partida"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })}

                    {/* Coaches rows */}
                    {coachesList.map((coach: any) => {
                      const isPresente = (formData.coachesPresentes || []).includes(coach.id);
                      const toggleCoach = () => {
                        const current: string[] = formData.coachesPresentes || [];
                        const updated = isPresente
                          ? current.filter((id: string) => id !== coach.id)
                          : [...current, coach.id];
                        setFormData({ ...formData, coachesPresentes: updated });
                      };
                      return (
                        <div
                          key={coach.id}
                          className={`grid grid-cols-[1fr_50px_50px_50px_50px_36px] gap-1 px-5 py-2.5 items-center border-t border-[#d3b379]/10 transition-all duration-200 bg-[#d3b379]/[0.02] ${
                            !isPresente ? 'opacity-40' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={toggleCoach}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                                isPresente
                                  ? 'bg-[#d3b379] border-[#d3b379]'
                                  : 'border-white/[0.12] hover:border-white/[0.25]'
                              }`}
                            >
                              {isPresente && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="#0b0b0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <div className="min-w-0 flex items-center gap-2">
                              <ClipboardList className="w-3.5 h-3.5 text-[#d3b379]/50 shrink-0" />
                              <div>
                                <span className="font-['Montserrat',sans-serif] text-[13px] font-medium text-white truncate">{coach.nome}</span>
                                <span className={`font-['Montserrat',sans-serif] text-[9px] tracking-wider uppercase block ${
                                  coach.atual ? 'text-[#d3b379]/40' : 'text-white/20'
                                }`}>
                                  {coach.atual ? 'Treinador' : 'Ex-Treinador'}
                                  {coach.periodoInicio ? ` · ${coach.periodoInicio}${coach.periodoFim ? '–' + coach.periodoFim : ''}` : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-center text-white/10 text-[10px]">—</span>
                          <span className="text-center text-white/10 text-[10px]">—</span>
                          <span className="text-center text-white/10 text-[10px]">—</span>
                          <span className="text-center text-white/10 text-[10px]">—</span>
                          <span />
                        </div>
                      );
                    })}
                  </>)}
                </div>

                {/* Summary footer */}
                {formData.sumula && (() => {
                  const presentes = (formData.sumula || []).filter((s: PlayerMatchStat) => s.presente).length;
                  const totalGols = (formData.sumula || []).reduce((a: number, s: PlayerMatchStat) => a + (s.gols || 0), 0);
                  const totalAsst = (formData.sumula || []).reduce((a: number, s: PlayerMatchStat) => a + (s.assistencias || 0), 0);
                  const totalDef = (formData.sumula || []).reduce((a: number, s: PlayerMatchStat) => a + (s.defesas || 0), 0);
                  const mvpPlayer = players.find((p: any) => (formData.sumula || []).find((s: PlayerMatchStat) => s.playerId === p.id && s.mvp));
                  return (
                    <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.04] shrink-0 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <span className="font-['Montserrat',sans-serif] text-[11px] text-white/30">
                          <span className="text-white/60 font-semibold">{presentes}</span> presentes
                        </span>
                        <span className="font-['Montserrat',sans-serif] text-[11px] text-white/30">
                          <span className="text-white/60 font-semibold">{totalGols}</span> gols
                        </span>
                        <span className="font-['Montserrat',sans-serif] text-[11px] text-white/30">
                          <span className="text-white/60 font-semibold">{totalAsst}</span> asst
                        </span>
                        {totalDef > 0 && (
                          <span className="font-['Montserrat',sans-serif] text-[11px] text-white/30">
                            <span className="text-emerald-400/60 font-semibold">{totalDef}</span> def
                          </span>
                        )}
                      </div>
                      {mvpPlayer && (
                        <span className="font-['Montserrat',sans-serif] text-[11px] text-amber-400/60">
                          <Trophy className="w-3 h-3 inline -mt-0.5 mr-1" />
                          MVP: <span className="font-semibold text-amber-400">{mvpPlayer.nome}</span>
                        </span>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="font-['Montserrat',sans-serif] text-sm text-white/20 text-center">Carregando jogadores...</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Footer Actions ═══ */}
        <div className="px-8 py-4 border-t border-white/[0.04] shrink-0 bg-[#0e0e0e]">
          <DialogActions onSave={() => {
            const dataToSave = {
              ...formData,
              placarCasa: typeof formData.placarCasa === 'number' ? formData.placarCasa : (parseInt(formData.placarCasa) || 0),
              placarFora: typeof formData.placarFora === 'number' ? formData.placarFora : (parseInt(formData.placarFora) || 0),
              coachPresente: (formData.coachesPresentes || []).length > 0,
            };
            onSave(dataToSave);
          }} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   Súmula Counter Component
   ═══════════════════════════════════════════ */
function SumulaCounter({ value, onChange, disabled, accent = 'text-white' }: {
  value: number; onChange: (v: number) => void; disabled?: boolean; accent?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${disabled ? 'pointer-events-none' : ''}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-all text-xs"
        tabIndex={-1}
      >
        -
      </button>
      <span className={`font-['Anton',sans-serif] text-sm w-5 text-center tabular-nums ${
        value > 0 ? accent : 'text-white/15'
      }`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-all text-xs"
        tabIndex={-1}
      >
        +
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Image Upload Zone — reusable drag & drop area
   ═══════════════════════════════════════════ */
function ImageUploadZone({ imageUrl, onUpload, uploading, label = 'Imagem', className = '' }: {
  imageUrl?: string | null; onUpload: (file: File) => void; uploading: boolean; label?: string; className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onUpload(file);
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className={labelClass}>{label}</Label>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
          dragOver ? 'border-[#d3b379]/60 bg-[#d3b379]/[0.06]' : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
        } ${imageUrl ? 'h-36' : 'h-28'}`}
      >
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} className="hidden" />
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#d3b379] animate-spin" />
          </div>
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex flex-col items-center gap-1 text-white/70">
                <Camera className="w-5 h-5" />
                <span className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase">Trocar foto</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white/20">
            <Upload className="w-5 h-5" />
            <span className="font-['Montserrat',sans-serif] text-[9px] tracking-[0.15em] uppercase">Arrastar ou clicar</span>
            <span className="font-['Montserrat',sans-serif] text-[8px] text-white/10">PNG, JPG (max 5MB)</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Toggle Pill — reusable on/off badge
   ═══════════════════════════════════════════ */
function TogglePill({ active, onClick, icon: Icon, label, activeLabel }: {
  active: boolean; onClick: () => void; icon: any; label: string; activeLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all font-['Montserrat',sans-serif] text-[10px] tracking-[0.15em] uppercase ${
        active
          ? 'bg-[#d3b379]/15 border-[#d3b379]/30 text-[#d3b379]'
          : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50'
      }`}
    >
      <Icon className="w-3.5 h-3.5" fill={active ? 'currentColor' : 'none'} />
      {active ? (activeLabel || label) : label}
    </button>
  );
}

/* ═══════════════════════════════════════════
   Shop Item Edit Dialog (enhanced)
   ═══════════════════════════════════════════ */
const SHOP_CATEGORIAS = ['Camisas', 'Acessórios', 'Canecas', 'Bonés', 'Calções', 'Meiões', 'Outros'];
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'Único'];

function ShopItemEditDialog({ item, onClose, onSave, onUploadImage }: any) {
  const [formData, setFormData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);

  useEffect(() => {
    if (item) setFormData({ ...item, imagens: item.imagens || (item.image ? [item.image] : []), tamanhos: item.tamanhos || [], lancamento: item.lancamento || false, esgotado: item.esgotado || false, destaque: item.destaque || false });
  }, [item]);

  if (!item || !formData) return null;

  async function handleMainUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (max 5MB)'); return; }
    setUploading(true);
    const url = await onUploadImage('shop', file);
    if (url) setFormData((prev: any) => ({ ...prev, image: url, imagens: [url, ...(prev.imagens || []).filter((u: string) => u !== prev.image)] }));
    setUploading(false);
  }

  async function handleExtraUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (max 5MB)'); return; }
    setUploadingExtra(true);
    const url = await onUploadImage('shop', file);
    if (url) setFormData((prev: any) => ({ ...prev, imagens: [...(prev.imagens || []), url] }));
    setUploadingExtra(false);
  }

  function removeExtraImage(idx: number) {
    setFormData((prev: any) => {
      const imgs = [...(prev.imagens || [])];
      imgs.splice(idx, 1);
      return { ...prev, imagens: imgs, image: imgs[0] || null };
    });
  }

  function toggleTamanho(tam: string) {
    setFormData((prev: any) => {
      const current = prev.tamanhos || [];
      return { ...prev, tamanhos: current.includes(tam) ? current.filter((t: string) => t !== tam) : [...current, tam] };
    });
  }

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className={`${dialogContentClass} max-w-2xl`}>
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>
            {formData.id ? 'Editar Item' : 'Novo Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label className={labelClass}>Nome</Label>
            <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Preço</Label>
              <Input value={formData.preco} onChange={(e) => setFormData({ ...formData, preco: e.target.value })} placeholder="R$ 70,00" className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Estoque</Label>
              <Input type="number" value={formData.estoque || 0} onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })} inputMode="numeric" onFocus={(e) => e.target.select()} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Categoria</Label>
              <Select value={formData.categoria || 'Camisas'} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {SHOP_CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white font-['Montserrat',sans-serif] text-sm">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Descrição</Label>
            <Textarea value={formData.descricao || ''} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className={inputClass} rows={3} />
          </div>

          {/* Main image upload */}
          <ImageUploadZone imageUrl={formData.image} onUpload={handleMainUpload} uploading={uploading} label="Foto principal" />

          {/* Extra images gallery */}
          <div className="space-y-2">
            <Label className={labelClass}>Fotos adicionais</Label>
            <div className="flex gap-2 flex-wrap">
              {(formData.imagens || []).slice(1).map((url: string, idx: number) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/[0.06] group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExtraImage(idx + 1)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <div
                onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = (e: any) => { const f = e.target.files?.[0]; if (f) handleExtraUpload(f); }; inp.click(); }}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-white/[0.08] hover:border-white/[0.15] flex items-center justify-center cursor-pointer transition-all bg-white/[0.02]"
              >
                {uploadingExtra ? <Loader2 className="w-4 h-4 text-[#d3b379] animate-spin" /> : <Plus className="w-4 h-4 text-white/20" />}
              </div>
            </div>
          </div>

          {/* Tamanhos */}
          <div className="space-y-2">
            <Label className={labelClass}>Tamanhos disponíveis</Label>
            <div className="flex gap-1.5 flex-wrap">
              {TAMANHOS.map((tam) => (
                <button key={tam} type="button" onClick={() => toggleTamanho(tam)}
                  className={`px-3 py-1.5 rounded-lg border transition-all font-['Montserrat',sans-serif] text-[10px] tracking-[0.1em] uppercase font-semibold ${
                    (formData.tamanhos || []).includes(tam)
                      ? 'bg-[#d3b379]/15 border-[#d3b379]/30 text-[#d3b379]'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/25 hover:text-white/40'
                  }`}
                >
                  {tam}
                </button>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <TogglePill active={formData.lancamento} onClick={() => setFormData({ ...formData, lancamento: !formData.lancamento })} icon={Star} label="Lançamento" activeLabel="Lançamento ativo" />
            <TogglePill active={formData.destaque} onClick={() => setFormData({ ...formData, destaque: !formData.destaque })} icon={Star} label="Destaque" activeLabel="Destaque ativo" />
            <TogglePill active={formData.esgotado} onClick={() => setFormData({ ...formData, esgotado: !formData.esgotado })} icon={Ban} label="Esgotado" activeLabel="Esgotado" />
          </div>

          <DialogActions onSave={() => onSave({ ...formData })} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   Sponsor Edit Dialog (enhanced)
   ═══════════════════════════════════════════ */
const SPONSOR_TIPOS = ['Master', 'Oficial', 'Parceiro', 'Apoiador', 'Fornecedor'];

function SponsorEditDialog({ sponsor, onClose, onSave, onUploadImage }: any) {
  const [formData, setFormData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (sponsor) setFormData({ ...sponsor, ativo: sponsor.ativo !== false });
  }, [sponsor]);

  if (!sponsor || !formData) return null;

  async function handleLogoUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (max 5MB)'); return; }
    setUploading(true);
    const url = await onUploadImage('sponsor', file);
    if (url) setFormData((prev: any) => ({ ...prev, logo: url }));
    setUploading(false);
  }

  return (
    <Dialog open={!!sponsor} onOpenChange={onClose}>
      <DialogContent className={`${dialogContentClass} max-w-2xl`}>
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>
            {formData.id ? 'Editar Patrocinador' : 'Novo Patrocinador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-[1fr_160px] gap-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={labelClass}>Nome</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Tipo</Label>
                  <Select value={formData.tipo || 'Parceiro'} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass}>
                      {SPONSOR_TIPOS.map((t) => (
                        <SelectItem key={t} value={t} className="text-white font-['Montserrat',sans-serif] text-sm">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Contato</Label>
                  <Input value={formData.contato || ''} onChange={(e) => setFormData({ ...formData, contato: e.target.value })} placeholder="Email ou telefone" className={inputClass} />
                </div>
              </div>
            </div>
            <ImageUploadZone imageUrl={formData.logo} onUpload={handleLogoUpload} uploading={uploading} label="Logo" />
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Descrição</Label>
            <Textarea value={formData.descricao || ''} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className={inputClass} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Instagram</Label>
              <Input value={formData.instagram || ''} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="https://instagram.com/..." className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Website</Label>
              <Input value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." className={inputClass} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TogglePill active={formData.ativo !== false} onClick={() => setFormData({ ...formData, ativo: !(formData.ativo !== false) })} icon={UserCheck} label="Ativar parceiro" activeLabel="Parceiro ativo" />
          </div>

          <DialogActions onSave={() => onSave(formData)} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   News Edit Dialog
   ═══════════════════════════════════════════ */

const NEWS_CATEGORIAS = ['Institucional', 'Resultado', 'Transferencia', 'Bastidores', 'Evento', 'Outro'];

function NewsEditDialog({ news, onClose, onSave, onUploadImage }: any) {
  const [formData, setFormData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (news) setFormData({ ...news });
  }, [news]);

  if (!news || !formData) return null;

  async function handleImageUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (max 5MB)'); return; }
    setUploading(true);
    const url = await onUploadImage('news', file);
    if (url) setFormData((prev: any) => ({ ...prev, imagem: url }));
    setUploading(false);
  }

  return (
    <Dialog open={!!news} onOpenChange={onClose}>
      <DialogContent className={`${dialogContentClass} max-w-2xl`}>
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>
            {formData.id ? 'Editar Notícia' : 'Nova Notícia'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label className={labelClass}>Título</Label>
            <Input value={formData.titulo || ''} onChange={(e: any) => setFormData({ ...formData, titulo: e.target.value })} className={inputClass} placeholder="Título da notícia" />
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div className="space-y-2">
              <Label className={labelClass}>Data</Label>
              <Input value={formData.data || ''} onChange={(e: any) => setFormData({ ...formData, data: e.target.value })} className={inputClass} placeholder="DD/MM/AAAA" />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Categoria</Label>
              <Select value={formData.categoria || 'Institucional'} onValueChange={(v: string) => setFormData({ ...formData, categoria: v })}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {NEWS_CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white font-['Montserrat',sans-serif] text-sm">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Autor</Label>
              <Input value={formData.autor || ''} onChange={(e: any) => setFormData({ ...formData, autor: e.target.value })} className={inputClass} placeholder="Nome do autor" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Resumo</Label>
            <Textarea value={formData.resumo || ''} onChange={(e: any) => setFormData({ ...formData, resumo: e.target.value })} className={inputClass} rows={2} placeholder="Breve descrição da notícia..." />
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Conteúdo completo</Label>
            <Textarea value={formData.conteudo || ''} onChange={(e: any) => setFormData({ ...formData, conteudo: e.target.value })} className={inputClass} rows={6} placeholder="Texto completo da notícia..." />
          </div>

          {/* Image upload */}
          <ImageUploadZone imageUrl={formData.imagem} onUpload={handleImageUpload} uploading={uploading} label="Imagem de capa" />

          <div className="flex items-center gap-2 flex-wrap">
            <TogglePill active={formData.destaque} onClick={() => setFormData({ ...formData, destaque: !formData.destaque })} icon={Star} label="Marcar destaque" activeLabel="Destaque ativo" />
          </div>

          <DialogActions onSave={() => onSave(formData)} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
