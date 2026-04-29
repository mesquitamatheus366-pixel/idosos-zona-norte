import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import {
  Settings,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Users,
  DollarSign,
  Save,
  X,
  ArrowLeft,
} from "lucide-react";

type Posicao = "goleiro" | "linha";
type Jogador = {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  nivel: number;
  foto_url: string | null;
  telefone: string | null;
  ativo: boolean;
  observacoes: string | null;
};

type Pagamento = {
  id: string;
  jogador_id: string;
  mes_referencia: string;
  tipo: "mensal" | "diarista";
  valor: number | null;
};

type Tab = "jogadores" | "pagamentos";

export function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("jogadores");

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Settings className="text-[#d3b379]" size={18} />
              <p className="font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] text-[#d3b379]">
                ADMIN
              </p>
            </div>
            <h1 className="font-['Roboto',sans-serif] font-bold text-3xl">
              Painel da Pelada
            </h1>
            <p className="text-white/40 text-xs mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-[11px] tracking-[0.18em]"
            >
              <ArrowLeft size={14} /> SITE
            </button>
            <button
              onClick={() => signOut().then(() => navigate("/login"))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-[11px] tracking-[0.18em]"
            >
              <LogOut size={14} /> SAIR
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-white/[0.06]">
          <TabBtn active={tab === "jogadores"} onClick={() => setTab("jogadores")} icon={<Users size={14} />} label="JOGADORES" />
          <TabBtn active={tab === "pagamentos"} onClick={() => setTab("pagamentos")} icon={<DollarSign size={14} />} label="PAGAMENTOS" />
        </div>

        {tab === "jogadores" && <AbaJogadores />}
        {tab === "pagamentos" && <AbaPagamentos />}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-3 font-['Roboto',sans-serif] text-[11px] tracking-[0.18em] border-b-2 transition-colors -mb-px ${
        active
          ? "text-[#d3b379] border-[#d3b379]"
          : "text-white/40 border-transparent hover:text-white/80"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- JOGADORES ---------------- */
function AbaJogadores() {
  const [lista, setLista] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Jogador | null>(null);
  const [criando, setCriando] = useState(false);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase.from("jogadores").select("*").order("nome");
    if (error) toast.error(error.message);
    setLista((data as Jogador[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function excluir(id: string) {
    if (!confirm("Excluir jogador? Os registros relacionados também serão removidos.")) return;
    const { error } = await supabase.from("jogadores").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Jogador excluído");
      carregar();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-white/50 text-sm">{lista.length} jogador(es)</p>
        <button
          onClick={() => setCriando(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d3b379] text-[#0b0b0b] font-['Roboto',sans-serif] text-[11px] tracking-[0.18em] font-bold hover:bg-[#e0c28a]"
        >
          <Plus size={14} /> NOVO JOGADOR
        </button>
      </div>

      {loading ? (
        <p className="text-white/40">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lista.map((j) => (
            <div
              key={j.id}
              className={`p-4 rounded-xl border bg-white/[0.02] flex items-center justify-between gap-3 ${
                j.ativo ? "border-white/[0.06]" : "border-white/[0.04] opacity-50"
              }`}
            >
              <div className="min-w-0">
                <p className="font-bold truncate">{j.apelido || j.nome}</p>
                <p className="text-white/40 text-xs uppercase tracking-wider">
                  {j.posicao} · nível {j.nivel} {!j.ativo && "· inativo"}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditando(j)}
                  className="p-2 rounded-lg text-white/50 hover:text-[#d3b379] hover:bg-white/[0.04]"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => excluir(j.id)}
                  className="p-2 rounded-lg text-white/50 hover:text-rose-400 hover:bg-white/[0.04]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(criando || editando) && (
        <ModalJogador
          jogador={editando}
          onClose={() => {
            setCriando(false);
            setEditando(null);
          }}
          onSaved={() => {
            setCriando(false);
            setEditando(null);
            carregar();
          }}
        />
      )}
    </div>
  );
}

function ModalJogador({
  jogador,
  onClose,
  onSaved,
}: {
  jogador: Jogador | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(jogador?.nome || "");
  const [apelido, setApelido] = useState(jogador?.apelido || "");
  const [posicao, setPosicao] = useState<Posicao>(jogador?.posicao || "linha");
  const [nivel, setNivel] = useState(jogador?.nivel || 3);
  const [foto_url, setFotoUrl] = useState(jogador?.foto_url || "");
  const [telefone, setTelefone] = useState(jogador?.telefone || "");
  const [ativo, setAtivo] = useState(jogador?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSalvando(true);
    const payload = {
      nome: nome.trim(),
      apelido: apelido.trim() || null,
      posicao,
      nivel,
      foto_url: foto_url.trim() || null,
      telefone: telefone.trim() || null,
      ativo,
    };
    const op = jogador
      ? supabase.from("jogadores").update(payload).eq("id", jogador.id)
      : supabase.from("jogadores").insert(payload);
    const { error } = await op;
    setSalvando(false);
    if (error) toast.error(error.message);
    else {
      toast.success(jogador ? "Atualizado" : "Cadastrado");
      onSaved();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#111] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl">{jogador ? "Editar jogador" : "Novo jogador"}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Nome">
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Apelido (opcional)">
            <input value={apelido} onChange={(e) => setApelido(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posição">
              <select value={posicao} onChange={(e) => setPosicao(e.target.value as Posicao)} className={inputCls}>
                <option value="linha">Linha</option>
                <option value="goleiro">Goleiro</option>
              </select>
            </Field>
            <Field label="Nível (1-5)">
              <input type="number" min={1} max={5} value={nivel} onChange={(e) => setNivel(Number(e.target.value))} className={inputCls} />
            </Field>
          </div>
          <Field label="Foto URL (opcional)">
            <input value={foto_url} onChange={(e) => setFotoUrl(e.target.value)} className={inputCls} placeholder="https://..." />
          </Field>
          <Field label="Telefone (opcional)">
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
            Ativo
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-full border border-white/15 text-white/70 text-[11px] tracking-[0.18em]">
            CANCELAR
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d3b379] text-[#0b0b0b] font-bold text-[11px] tracking-[0.18em] disabled:opacity-50"
          >
            <Save size={14} /> {salvando ? "SALVANDO..." : "SALVAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- PAGAMENTOS ---------------- */
function AbaPagamentos() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    const mesData = `${mes}-01`;
    const [{ data: jg }, { data: pg }] = await Promise.all([
      supabase.from("jogadores").select("*").eq("ativo", true).order("nome"),
      supabase.from("pagamentos").select("*").eq("mes_referencia", mesData),
    ]);
    setJogadores((jg as Jogador[]) || []);
    setPagamentos((pg as Pagamento[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, [mes]);

  async function setTipo(jogadorId: string, tipo: "mensal" | "diarista" | null) {
    const mesData = `${mes}-01`;
    const existente = pagamentos.find((p) => p.jogador_id === jogadorId);
    if (tipo === null) {
      if (existente) {
        const { error } = await supabase.from("pagamentos").delete().eq("id", existente.id);
        if (error) toast.error(error.message);
      }
    } else if (existente) {
      const { error } = await supabase.from("pagamentos").update({ tipo }).eq("id", existente.id);
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.from("pagamentos").insert({
        jogador_id: jogadorId,
        mes_referencia: mesData,
        tipo,
      });
      if (error) toast.error(error.message);
    }
    carregar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-white/40 mb-1">MÊS DE REFERÊNCIA</p>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className={inputCls + " w-44"}
          />
        </div>
        <p className="text-white/50 text-xs">
          Defina o tipo de pagamento de cada jogador para este mês.
        </p>
      </div>

      {loading ? (
        <p className="text-white/40">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {jogadores.map((j) => {
            const p = pagamentos.find((x) => x.jogador_id === j.id);
            const tipo = p?.tipo;
            return (
              <div
                key={j.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{j.apelido || j.nome}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">{j.posicao}</p>
                </div>
                <div className="flex gap-1">
                  <PillBtn ativo={tipo === "mensal"} onClick={() => setTipo(j.id, "mensal")}>
                    MENSAL
                  </PillBtn>
                  <PillBtn ativo={tipo === "diarista"} onClick={() => setTipo(j.id, "diarista")}>
                    DIARISTA
                  </PillBtn>
                  {tipo && (
                    <button
                      onClick={() => setTipo(j.id, null)}
                      className="px-2 py-1.5 rounded-full text-white/40 hover:text-rose-400 text-[10px] tracking-[0.15em]"
                    >
                      LIMPAR
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PillBtn({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[10px] tracking-[0.15em] font-bold border transition-colors ${
        ativo
          ? "bg-[#d3b379] text-[#0b0b0b] border-[#d3b379]"
          : "border-white/15 text-white/60 hover:text-white hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.18em] text-white/40 mb-1">{label.toUpperCase()}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#d3b379]/50 focus:bg-white/[0.05]";
