export function Sobre() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88] mb-3">
          A PELADA
        </p>
        <h1 className="font-['Roboto',sans-serif] font-bold text-4xl sm:text-5xl mb-8">
          Sobre os Idosos
        </h1>

        <div className="space-y-6 text-white/70 leading-relaxed">
          <p>
            <strong className="text-white">Idosos da Zona Norte</strong> é o nome de
            brincadeira da nossa pelada — um grupo de jovens que joga mensal e
            diariamente, com a seriedade de quem leva o futebol no sangue (e o
            humor de quem se chama de idoso).
          </p>

          <p>
            Tem dois tipos de jogador: o <strong className="text-[#22ff88]">mensalista</strong>,
            que paga uma mensalidade fixa e tem prioridade nas partidas e benefícios; e o{" "}
            <strong className="text-[#22ff88]">diarista</strong>, que paga por jogo. A
            tag pode mudar todo mês — então fique de olho no histórico do jogador na
            página dele.
          </p>

          <p>
            O sorteio dos times tenta sempre equilibrar a galera por nível técnico e
            posição (goleiro, fixo, ala, meio e pivô) — então não adianta reclamar quando seu time
            perder. As estatísticas registram tudo: gols, assistências, vitórias,
            empates, derrotas, presença e o MVP de cada partida.
          </p>
        </div>

        <div className="mt-12 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <h3 className="font-['Roboto',sans-serif] font-bold text-lg mb-2">Tipos de pelada</h3>
          <ul className="space-y-2 text-white/60 text-sm">
            <li>
              <span className="text-[#22ff88] font-bold">Mensal:</span> o racha grande do
              mês, evento maior com mais gente.
            </li>
            <li>
              <span className="text-[#22ff88] font-bold">Diária:</span> as peladas da
              semana, mais frequentes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
