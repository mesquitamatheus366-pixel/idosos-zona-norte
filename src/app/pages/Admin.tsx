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
  Calendar,
  Trophy,
  Check,
  Camera,
  Upload,
  Loader2,
} from "lucide-react";

type Posicao = "goleiro" | "fixo" | "ala" | "meio" | "pivo";

const POSICOES: { v: Posicao; label: string }[] = [
  { v: "goleiro", label: "Goleiro" },
  { v: "fixo", label: "Fixo" },
  { v: "ala", label: "Ala" },
  { v: "meio", label: "Meio" },
  { v: "pivo", label: "Pivô" },
];
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

type Jogo = {
  id: string;
  data_jogo: string;
  tipo: "diaria" | "mensal";
  local: string | null;
  finalizado: boolean;
  observacoes: string | null;
};

type Tab = "jogadores" | "pagamentos" | "jogos";

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
              <Settings className="text-[#22ff88]" size={18} />
              <p className="font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] text-[#22ff88]">
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
          <TabBtn active={tab === "jogos"} onClick={() => setTab("jogos")} icon={<Calendar size={14} />} label="JOGOS" />
        </div>

        {tab === "jogadores" && <AbaJogadores />}
        {tab === "pagamentos" && <AbaPagamentos />}
        {tab === "jogos" && <AbaJogos />}
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
          ? "text-[#22ff88] border-[#22ff88]"
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22ff88] text-[#0b0b0b] font-['Roboto',sans-serif] text-[11px] tracking-[0.18em] font-bold hover:bg-[#5cffaa]"
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
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center text-white/40 text-[10px] font-bold shrink-0">
                  {j.foto_url ? (
                    <img src={j.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (j.apelido || j.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate">{j.apelido || j.nome}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">
                    {POSICOES.find((p) => p.v === j.posicao)?.label || j.posicao} · nível {j.nivel}/10 {!j.ativo && "· inativo"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditando(j)}
                  className="p-2 rounded-lg text-white/50 hover:text-[#22ff88] hover:bg-white/[0.04]"
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
  const [posicao, setPosicao] = useState<Posicao>(jogador?.posicao || "ala");
  const [nivel, setNivel] = useState(jogador?.nivel || 5);
  const [fotoUrl, setFotoUrl] = useState(jogador?.foto_url || "");
  const [telefone, setTelefone] = useState(jogador?.telefone || "");
  const [ativo, setAtivo] = useState(jogador?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  async function uploadFoto(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo precisa ser uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem máx 5MB");
      return;
    }
    setUploadando(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("fotos-jogadores")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) {
      toast.error(error.message);
      setUploadando(false);
      return;
    }
    const { data } = supabase.storage.from("fotos-jogadores").getPublicUrl(path);
    setFotoUrl(data.publicUrl);
    setUploadando(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFoto(file);
  }

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
      foto_url: fotoUrl || null,
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-[#0f1410] to-[#0b0b0b] border border-[#22ff88]/15 rounded-3xl p-7 shadow-[0_0_60px_rgba(34,255,136,0.08)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-[#22ff88]">
              {jogador ? "EDITANDO" : "NOVO"}
            </p>
            <h2 className="font-bold text-2xl mt-0.5">
              {jogador ? jogador.apelido || jogador.nome : "Cadastrar jogador"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2 -m-2">
            <X size={20} />
          </button>
        </div>

        {/* FOTO upload */}
        <div className="flex gap-4 items-start mb-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={onDrop}
            className={`relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed transition-colors ${
              arrastando
                ? "border-[#22ff88] bg-[#22ff88]/10"
                : fotoUrl
                ? "border-transparent"
                : "border-white/10 bg-white/[0.02] hover:border-[#22ff88]/40"
            }`}
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-[10px] text-center px-2">
                {uploadando ? <Loader2 className="animate-spin" size={20} /> : <Camera size={22} />}
                <span className="mt-1.5">arraste ou clique</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadFoto(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploadando}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.18em] text-white/40 mb-2">FOTO DO JOGADOR</p>
            <p className="text-white/50 text-xs leading-relaxed">
              Arraste uma imagem ou clique pra escolher. JPG/PNG até 5MB.
            </p>
            {fotoUrl && (
              <button
                onClick={() => setFotoUrl("")}
                className="mt-2 text-rose-400/80 hover:text-rose-300 text-[10px] tracking-[0.18em]"
              >
                REMOVER FOTO
              </button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome">
              <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} placeholder="Nome completo" />
            </Field>
            <Field label="Apelido">
              <input value={apelido} onChange={(e) => setApelido(e.target.value)} className={inputCls} placeholder="Como é chamado" />
            </Field>
          </div>

          <Field label="Posição">
            <div className="flex flex-wrap gap-1.5">
              {POSICOES.map((p) => (
                <button
                  key={p.v}
                  type="button"
                  onClick={() => setPosicao(p.v)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${
                    posicao === p.v
                      ? "bg-[#22ff88] text-[#0b0b0b] shadow-[0_0_16px_rgba(34,255,136,0.4)]"
                      : "border border-white/10 text-white/60 hover:border-[#22ff88]/40 hover:text-white"
                  }`}
                >
                  {p.label.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Nível · ${nivel}/10`}>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNivel(n)}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${
                    n <= nivel
                      ? "bg-[#22ff88] text-[#0b0b0b] shadow-[0_0_8px_rgba(34,255,136,0.3)]"
                      : "bg-white/[0.04] text-white/30 hover:bg-white/[0.08]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Telefone (opcional)">
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputCls} placeholder="(11) 9..." />
          </Field>

          <button
            type="button"
            onClick={() => setAtivo(!ativo)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-medium">Jogador ativo</p>
              <p className="text-xs text-white/40">Aparece nas listas e sorteios</p>
            </div>
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${
                ativo ? "bg-[#22ff88]" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  ativo ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        </div>

        <div className="flex justify-end gap-2 mt-7">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-white/15 text-white/70 text-[11px] tracking-[0.18em] hover:border-white/30">
            CANCELAR
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#22ff88] text-[#0b0b0b] font-bold text-[11px] tracking-[0.18em] disabled:opacity-50 hover:bg-[#5cffaa] shadow-[0_0_24px_rgba(34,255,136,0.3)]"
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
                  <p className="text-white/40 text-xs uppercase tracking-wider">{POSICOES.find((p) => p.v === j.posicao)?.label || j.posicao}</p>
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
          ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88]"
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
  "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#22ff88]/50 focus:bg-white/[0.05]";

/* ---------------- JOGOS ---------------- */
function AbaJogos() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [gerenciando, setGerenciando] = useState<Jogo | null>(null);

  async function carregar() {
    setLoading(true);
    const { data } = await supabase.from("jogos").select("*").order("data_jogo", { ascending: false });
    setJogos((data as Jogo[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function excluir(id: string) {
    if (!confirm("Excluir jogo? Estatísticas e times sorteados serão removidos.")) return;
    const { error } = await supabase.from("jogos").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Jogo excluído");
      carregar();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-white/50 text-sm">{jogos.length} jogo(s)</p>
        <button
          onClick={() => setCriando(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22ff88] text-[#0b0b0b] font-bold text-[11px] tracking-[0.18em] hover:bg-[#5cffaa]"
        >
          <Plus size={14} /> NOVO JOGO
        </button>
      </div>

      {loading ? (
        <p className="text-white/40">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {jogos.map((j) => {
            const data = new Date(j.data_jogo);
            return (
              <div
                key={j.id}
                className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold">
                    {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">
                    {j.tipo === "mensal" ? "Mensal" : "Diária"}
                    {j.local && ` · ${j.local}`}
                    {j.finalizado ? " · finalizado" : " · em aberto"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setGerenciando(j)}
                    className="px-3 py-1.5 rounded-full border border-[#22ff88]/40 text-[#22ff88] text-[10px] tracking-[0.18em] hover:bg-[#22ff88]/10"
                  >
                    LANÇAR
                  </button>
                  <button
                    onClick={() => excluir(j.id)}
                    className="p-2 rounded-lg text-white/50 hover:text-rose-400 hover:bg-white/[0.04]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {criando && <ModalNovoJogo onClose={() => setCriando(false)} onSaved={() => { setCriando(false); carregar(); }} />}
      {gerenciando && (
        <ModalGerenciarJogo
          jogo={gerenciando}
          onClose={() => setGerenciando(null)}
          onSaved={() => {
            setGerenciando(null);
            carregar();
          }}
        />
      )}
    </div>
  );
}

function ModalNovoJogo({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 16));
  const [tipo, setTipo] = useState<"diaria" | "mensal">("diaria");
  const [local, setLocal] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    const { error } = await supabase.from("jogos").insert({
      data_jogo: new Date(data).toISOString(),
      tipo,
      local: local.trim() || null,
    });
    setSalvando(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Jogo criado");
      onSaved();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl">Novo jogo</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <Field label="Data e hora">
            <input type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Tipo">
            <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className={inputCls}>
              <option value="diaria">Pelada Diária</option>
              <option value="mensal">Pelada Mensal</option>
            </select>
          </Field>
          <Field label="Local (opcional)">
            <input value={local} onChange={(e) => setLocal(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-full border border-white/15 text-white/70 text-[11px] tracking-[0.18em]">CANCELAR</button>
          <button onClick={salvar} disabled={salvando} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22ff88] text-[#0b0b0b] font-bold text-[11px] tracking-[0.18em] disabled:opacity-50">
            <Save size={14} /> {salvando ? "SALVANDO..." : "CRIAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

type StatRow = {
  jogador_id: string;
  nome: string;
  presente: boolean;
  gols: number;
  assistencias: number;
  resultado: "V" | "E" | "D" | null;
  mvp: boolean;
};

function ModalGerenciarJogo({
  jogo,
  onClose,
  onSaved,
}: {
  jogo: Jogo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [finalizado, setFinalizado] = useState(jogo.finalizado);

  useEffect(() => {
    (async () => {
      const [{ data: jg }, { data: stats }, { data: ts }] = await Promise.all([
        supabase.from("jogadores").select("id, nome, apelido").eq("ativo", true).order("nome"),
        supabase.from("estatisticas_jogo").select("*").eq("jogo_id", jogo.id),
        supabase.from("times_sorteados").select("jogador_id").eq("jogo_id", jogo.id),
      ]);
      const sorteados = new Set((ts as any[] || []).map((r) => r.jogador_id));
      const statMap = new Map((stats as any[] || []).map((s) => [s.jogador_id, s]));
      const list: StatRow[] = ((jg as any[]) || []).map((j) => {
        const s = statMap.get(j.id);
        return {
          jogador_id: j.id,
          nome: j.apelido || j.nome,
          presente: s ? !!s.presente : sorteados.has(j.id),
          gols: s?.gols || 0,
          assistencias: s?.assistencias || 0,
          resultado: s?.resultado || null,
          mvp: !!s?.mvp,
        };
      });
      setRows(list);
      setLoading(false);
    })();
  }, [jogo.id]);

  function update(idx: number, patch: Partial<StatRow>) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function setMVPUnico(idx: number) {
    setRows((rs) => rs.map((r, i) => ({ ...r, mvp: i === idx ? !r.mvp : false })));
  }

  async function salvar() {
    setSalvando(true);
    const presentes = rows.filter((r) => r.presente);
    const ausentes = rows.filter((r) => !r.presente);

    if (ausentes.length) {
      const ids = ausentes.map((a) => a.jogador_id);
      await supabase.from("estatisticas_jogo").delete().eq("jogo_id", jogo.id).in("jogador_id", ids);
    }

    if (presentes.length) {
      const payload = presentes.map((r) => ({
        jogo_id: jogo.id,
        jogador_id: r.jogador_id,
        presente: true,
        gols: r.gols,
        assistencias: r.assistencias,
        resultado: r.resultado,
        mvp: r.mvp,
      }));
      const { error } = await supabase
        .from("estatisticas_jogo")
        .upsert(payload, { onConflict: "jogo_id,jogador_id" });
      if (error) {
        toast.error(error.message);
        setSalvando(false);
        return;
      }
    }

    await supabase.from("jogos").update({ finalizado }).eq("id", jogo.id);
    setSalvando(false);
    toast.success("Estatísticas salvas");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#111] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-xl">Lançar resultado</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-white/40 text-xs mb-4">
          {new Date(jogo.data_jogo).toLocaleString("pt-BR")} · {jogo.tipo}
        </p>

        {loading ? (
          <p className="text-white/40">Carregando...</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] tracking-[0.15em] text-white/40 border-b border-white/[0.06]">
                    <th className="px-3 py-2 text-left">JOGADOR</th>
                    <th className="px-2 py-2 text-center">PRES.</th>
                    <th className="px-2 py-2 text-center">G</th>
                    <th className="px-2 py-2 text-center">A</th>
                    <th className="px-2 py-2 text-center">RESULTADO</th>
                    <th className="px-2 py-2 text-center">MVP</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.jogador_id} className={`border-b border-white/[0.04] ${!r.presente && "opacity-40"}`}>
                      <td className="px-3 py-1.5">{r.nome}</td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={r.presente}
                          onChange={(e) => update(i, { presente: e.target.checked })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          disabled={!r.presente}
                          value={r.gols}
                          onChange={(e) => update(i, { gols: Number(e.target.value) })}
                          className="w-14 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-center text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          disabled={!r.presente}
                          value={r.assistencias}
                          onChange={(e) => update(i, { assistencias: Number(e.target.value) })}
                          className="w-14 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-center text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex gap-0.5 justify-center">
                          {(["V", "E", "D"] as const).map((res) => (
                            <button
                              key={res}
                              disabled={!r.presente}
                              onClick={() => update(i, { resultado: r.resultado === res ? null : res })}
                              className={`w-7 h-7 rounded text-xs font-bold ${
                                r.resultado === res
                                  ? res === "V"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                    : res === "E"
                                    ? "bg-white/10 text-white/80 border border-white/20"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : "border border-white/10 text-white/40"
                              }`}
                            >
                              {res}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          disabled={!r.presente}
                          onClick={() => setMVPUnico(i)}
                          className={`w-7 h-7 rounded ${r.mvp ? "bg-[#22ff88] text-[#0b0b0b]" : "border border-white/10 text-white/30"}`}
                        >
                          {r.mvp ? <Check size={14} className="mx-auto" /> : <Trophy size={12} className="mx-auto" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="flex items-center gap-2 mt-4 text-sm text-white/70">
              <input type="checkbox" checked={finalizado} onChange={(e) => setFinalizado(e.target.checked)} />
              Marcar jogo como finalizado
            </label>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={onClose} className="px-4 py-2 rounded-full border border-white/15 text-white/70 text-[11px] tracking-[0.18em]">FECHAR</button>
              <button onClick={salvar} disabled={salvando} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22ff88] text-[#0b0b0b] font-bold text-[11px] tracking-[0.18em] disabled:opacity-50">
                <Save size={14} /> {salvando ? "SALVANDO..." : "SALVAR TUDO"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
