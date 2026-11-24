// Configurações principais do Truco Matemático
const MAXIMO_RODADAS = 8;
const PONTOS_PARA_VENCER = 12;

// Valores do baralho de Truco em ordem crescente de força
const VALORES_CARTAS = ["4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"];

// Naipes em ordem crescente de força (usado para desempatar manilhas)
const NAIPES = [
  { simbolo: "♦", nome: "Ouros", cor: "vermelha", forca: 1 },
  { simbolo: "♠", nome: "Espadas", cor: "preta", forca: 2 },
  { simbolo: "♥", nome: "Copas", cor: "vermelha", forca: 3 },
  { simbolo: "♣", nome: "Paus", cor: "preta", forca: 4 }
];

// Estado atual do jogo
const estadoJogo = {
  rodadaAtual: 1,
  pontosJogador: 0,
  pontosPc: 0,
  valorRodada: 1,
  trucoPedido: false,
  manilhaValor: "4",
  maoJogador: [],
  cartaPcAtual: null,
  cartaEscolhidaJogador: null,
  desafioAtual: null,
  tempoInicio: 0,
  jogoAtivo: false
};

// Elementos da tela (HTML)
const el = {
  infoRodada: document.getElementById("info-rodada"),
  pontosJogador: document.getElementById("pontos-jogador"),
  pontosPc: document.getElementById("pontos-pc"),
  valorRodada: document.getElementById("valor-rodada"),
  btnTema: document.getElementById("btn-tema"),
  cartaPc: document.getElementById("carta-pc"),
  cartaJogadorMesa: document.getElementById("carta-jogador-mesa"),
  maoCartas: document.getElementById("mao-cartas"),
  badgeManilha: document.getElementById("badge-manilha"),
  instrucaoJogada: document.getElementById("instrucao-jogada"),
  btnTruco: document.getElementById("btn-truco"),
  etiquetaDesafio: document.getElementById("etiqueta-desafio"),
  expressaoMatematica: document.getElementById("expressao-matematica"),
  opcoesResposta: document.getElementById("opcoes-resposta"),
  tituloFeedback: document.getElementById("titulo-feedback"),
  textoFeedback: document.getElementById("texto-feedback"),
  tituloFim: document.getElementById("titulo-fim"),
  resumoFim: document.getElementById("resumo-fim"),
  telas: {
    inicio: document.getElementById("tela-inicio"),
    jogada: document.getElementById("tela-jogada"),
    conta: document.getElementById("tela-conta"),
    feedback: document.getElementById("tela-feedback"),
    fim: document.getElementById("tela-fim")
  }
};

// --- COMUNICAÇÃO COM O PORTAL (Contrato obrigatório) ---

function avisarAlturaPortal() {
  const altura = document.documentElement.scrollHeight;
  window.parent.postMessage({ type: "vrgame:resize", height: altura }, "*");
}

function aplicarTema(tema) {
  if (tema === "dark" || tema === "escuro") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  avisarAlturaPortal();
}

window.addEventListener("message", (evento) => {
  const dados = evento.data;
  if (!dados || typeof dados !== "object") return;

  if (dados.type === "vrgame:theme") {
    aplicarTema(dados.theme || dados.value);
  }

  if (dados.type === "vrgame:fullscreen") {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }
});

window.addEventListener("resize", avisarAlturaPortal);

window.addEventListener("load", () => {
  // Detecta preferência inicial do sistema
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    aplicarTema("dark");
  }
  window.parent.postMessage({ type: "vrgame:ready" }, "*");
  avisarAlturaPortal();
});

// --- LÓGICA DO BARALHO E REGRAS DO TRUCO ---

function criarBaralhoEmbaralhado() {
  const baralho = [];
  for (let i = 0; i < VALORES_CARTAS.length; i++) {
    for (let j = 0; j < NAIPES.length; j++) {
      baralho.push({
        valor: VALORES_CARTAS[i],
        indiceValor: i,
        naipe: NAIPES[j]
      });
    }
  }

  // Embaralha usando algoritmo Fisher-Yates
  for (let i = baralho.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    const temp = baralho[i];
    baralho[i] = baralho[k];
    baralho[k] = temp;
  }
  return baralho;
}

// Calcula a força real de uma carta considerando a manilha da rodada
function calcularForcaCarta(carta) {
  const ehManilha = carta.valor === estadoJogo.manilhaValor;
  if (ehManilha) {
    // Manilha ganha de qualquer carta comum (força base 100 + força do naipe)
    return 100 + carta.naipe.forca;
  }
  return carta.indiceValor;
}

// --- GERADOR DE DESAFIOS MATEMÁTICOS ---

function gerarDesafioMatematico(rodada) {
  // Dificuldade aumenta gradualmente conforme a rodada
  let numA, numB, operacao, respostaCerta, explicacao;

  if (rodada <= 2) {
    // Rodadas iniciais: soma e subtração simples
    numA = Math.floor(Math.random() * 20) + 10;
    numB = Math.floor(Math.random() * 15) + 5;
    if (Math.random() < 0.5) {
      operacao = "+";
      respostaCerta = numA + numB;
      explicacao = `${numA} + ${numB} = ${respostaCerta}`;
    } else {
      operacao = "-";
      respostaCerta = numA - numB;
      explicacao = `${numA} - ${numB} = ${respostaCerta}`;
    }
  } else if (rodada <= 5) {
    // Rodadas intermediárias: multiplicação ou soma maior
    if (Math.random() < 0.6) {
      numA = Math.floor(Math.random() * 8) + 3;
      numB = Math.floor(Math.random() * 8) + 3;
      operacao = "×";
      respostaCerta = numA * numB;
      explicacao = `${numA} × ${numB} = ${respostaCerta}`;
    } else {
      numA = Math.floor(Math.random() * 45) + 25;
      numB = Math.floor(Math.random() * 35) + 15;
      operacao = "+";
      respostaCerta = numA + numB;
      explicacao = `${numA} + ${numB} = ${respostaCerta}`;
    }
  } else {
    // Rodadas finais: multiplicações maiores ou expressões com dois passos
    if (Math.random() < 0.5) {
      numA = Math.floor(Math.random() * 7) + 6;
      numB = Math.floor(Math.random() * 6) + 7;
      operacao = "×";
      respostaCerta = numA * numB;
      explicacao = `${numA} × ${numB} = ${respostaCerta}`;
    } else {
      numA = Math.floor(Math.random() * 6) + 3;
      numB = Math.floor(Math.random() * 5) + 2;
      const numC = Math.floor(Math.random() * 10) + 4;
      respostaCerta = numA * numB + numC;
      explicacao = `Primeiro multiplicamos (${numA} × ${numB} = ${numA * numB}) e depois somamos ${numC}, dando ${respostaCerta}`;
      return {
        texto: `${numA} × ${numB} + ${numC} = ?`,
        respostaCerta,
        explicacao,
        opcoes: gerarOpcoesAlternativas(respostaCerta)
      };
    }
  }

  return {
    texto: `${numA} ${operacao} ${numB} = ?`,
    respostaCerta,
    explicacao,
    opcoes: gerarOpcoesAlternativas(respostaCerta)
  };
}

function gerarOpcoesAlternativas(correta) {
  const opcoes = new Set([correta]);
  const variacoes = [-10, -4, -2, -1, 1, 2, 4, 10];

  while (opcoes.size < 4) {
    const desvio = variacoes[Math.floor(Math.random() * variacoes.length)];
    const candidata = correta + desvio;
    if (candidata > 0 && candidata !== correta) {
      opcoes.add(candidata);
    }
  }

  // Embaralha as 4 opções
  return Array.from(opcoes).sort(() => Math.random() - 0.5);
}

// --- CONTROLE DE INTERFACE ---

function mostrarPainel(nomeTela) {
  Object.keys(el.telas).forEach((chave) => {
    el.telas[chave].classList.toggle("ativo", chave === nomeTela);
  });
  avisarAlturaPortal();
}

function atualizarPlacarVisual() {
  el.infoRodada.textContent = `Rodada ${estadoJogo.rodadaAtual} de ${MAXIMO_RODADAS}`;
  el.pontosJogador.textContent = estadoJogo.pontosJogador;
  el.pontosPc.textContent = estadoJogo.pontosPc;
  el.valorRodada.textContent = `${estadoJogo.valorRodada} ${estadoJogo.valorRodada === 1 ? "pt" : "pts"}`;
}

function criarHtmlCarta(carta, revelada = true) {
  if (!revelada) {
    return `<span class="carta-centro">?</span>`;
  }
  const ehManilha = carta.valor === estadoJogo.manilhaValor;
  const tagManilha = ehManilha ? `<span class="tag-manilha">Manilha</span>` : "";

  return `
    <span class="carta-topo">${carta.valor} ${carta.naipe.simbolo}</span>
    <span class="carta-centro">${carta.naipe.simbolo}</span>
    <span class="carta-base">${carta.valor} ${carta.naipe.simbolo}</span>
    ${tagManilha}
  `;
}

function renderizarCartaNaMesa(elemento, carta, revelada = true) {
  elemento.className = "carta";
  if (!carta) {
    elemento.classList.add("carta-vazia");
    elemento.innerHTML = `<span class="carta-centro">-</span>`;
    return;
  }

  if (!revelada) {
    elemento.classList.add("carta-pc", "oculta");
    elemento.innerHTML = `<span class="carta-centro">?</span>`;
    return;
  }

  elemento.classList.add(carta.naipe.cor);
  if (carta.valor === estadoJogo.manilhaValor) {
    elemento.classList.add("manilha");
  }
  elemento.innerHTML = criarHtmlCarta(carta, true);
}

function renderizarMaoJogador(habilitada = true) {
  el.maoCartas.innerHTML = "";

  estadoJogo.maoJogador.forEach((carta, indice) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn-carta";
    botao.disabled = !habilitada;
    botao.setAttribute("aria-label", `Carta ${carta.valor} de ${carta.naipe.nome}`);

    const divCarta = document.createElement("div");
    divCarta.className = `carta ${carta.naipe.cor}`;
    if (carta.valor === estadoJogo.manilhaValor) {
      divCarta.classList.add("manilha");
    }
    divCarta.innerHTML = criarHtmlCarta(carta, true);

    botao.appendChild(divCarta);
    botao.addEventListener("click", () => selecionarCartaJogador(indice));
    el.maoCartas.appendChild(botao);
  });
}

// --- FLUXO DA PARTIDA ---

function iniciarNovaPartida() {
  estadoJogo.rodadaAtual = 1;
  estadoJogo.pontosJogador = 0;
  estadoJogo.pontosPc = 0;
  estadoJogo.tempoInicio = Date.now();
  estadoJogo.jogoAtivo = true;

  prepararRodada();
}

function prepararRodada() {
  estadoJogo.valorRodada = 1;
  estadoJogo.trucoPedido = false;
  estadoJogo.cartaEscolhidaJogador = null;

  const baralho = criarBaralhoEmbaralhado();

  // Define a carta "vira" e descobre qual é a manilha da rodada
  const vira = baralho.pop();
  const indiceManilha = (vira.indiceValor + 1) % VALORES_CARTAS.length;
  estadoJogo.manilhaValor = VALORES_CARTAS[indiceManilha];

  // Distribui 3 cartas para o jogador e 1 carta para o PC jogar na mesa
  estadoJogo.maoJogador = [baralho.pop(), baralho.pop(), baralho.pop()];
  estadoJogo.cartaPcAtual = baralho.pop();

  // Atualiza elementos na tela
  atualizarPlacarVisual();
  el.badgeManilha.textContent = `${estadoJogo.manilhaValor} (vira: ${vira.valor}${vira.naipe.simbolo})`;
  el.btnTruco.disabled = false;
  el.btnTruco.textContent = "PEDIR TRUCO! (3 pts)";
  el.instrucaoJogada.textContent = "Escolha uma carta abaixo para enfrentar o PC!";

  // PC joga sua carta virada para cima para o jogador pensar na estratégia
  renderizarCartaNaMesa(el.cartaPc, estadoJogo.cartaPcAtual, true);
  renderizarCartaNaMesa(el.cartaJogadorMesa, null);
  renderizarMaoJogador(true);

  mostrarPainel("jogada");
}

function pedirTruco() {
  if (estadoJogo.trucoPedido) return;
  estadoJogo.trucoPedido = true;
  estadoJogo.valorRodada = 3;
  el.btnTruco.disabled = true;
  el.btnTruco.textContent = "TRUCO PEDIDO! (Vale 3 pts)";
  el.instrucaoJogada.textContent = "Agora escolha sua melhor carta e acerte a conta!";
  atualizarPlacarVisual();
}

function selecionarCartaJogador(indice) {
  estadoJogo.cartaEscolhidaJogador = estadoJogo.maoJogador[indice];

  // Mostra a carta escolhida na mesa e trava a mão
  renderizarCartaNaMesa(el.cartaJogadorMesa, estadoJogo.cartaEscolhidaJogador, true);
  renderizarMaoJogador(false);

  // Gera o cálculo mental
  estadoJogo.desafioAtual = gerarDesafioMatematico(estadoJogo.rodadaAtual);
  el.etiquetaDesafio.textContent = estadoJogo.trucoPedido
    ? "Desafio do TRUCO! Acerte para valer 3 pontos:"
    : "Resolva de cabeça para confirmar sua jogada:";
  el.expressaoMatematica.textContent = estadoJogo.desafioAtual.texto;

  // Cria os botões de alternativa
  el.opcoesResposta.innerHTML = "";
  estadoJogo.desafioAtual.opcoes.forEach((valorOpcao) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-opcao";
    btn.textContent = valorOpcao;
    btn.addEventListener("click", () => verificarRespostaMatematica(valorOpcao));
    el.opcoesResposta.appendChild(btn);
  });

  mostrarPainel("conta");
}

function verificarRespostaMatematica(respostaEscolhida) {
  const desafio = estadoJogo.desafioAtual;
  const acertouConta = respostaEscolhida === desafio.respostaCerta;

  const cartaJog = estadoJogo.cartaEscolhidaJogador;
  const cartaPc = estadoJogo.cartaPcAtual;
  const forcaJogador = calcularForcaCarta(cartaJog);
  const forcaPc = calcularForcaCarta(cartaPc);

  const pontosDisputados = estadoJogo.valorRodada;
  let titulo = "";
  let mensagem = "";

  if (!acertouConta) {
    // Errou a conta: PC ganha os pontos da rodada
    estadoJogo.pontosPc += pontosDisputados;
    titulo = "Ops! Cálculo incorreto";
    mensagem = `Você marcou ${respostaEscolhida}, mas ${desafio.explicacao}. O PC levou ${pontosDisputados} ${pontosDisputados === 1 ? "ponto" : "pontos"}.`;
  } else if (forcaJogador > forcaPc) {
    // Acertou a conta e tem carta mais forte
    estadoJogo.pontosJogador += pontosDisputados;
    titulo = "Jogada perfeita! Você venceu!";
    mensagem = `Acertou (${desafio.explicacao}) e seu ${cartaJog.valor}${cartaJog.naipe.simbolo} ganhou do ${cartaPc.valor}${cartaPc.naipe.simbolo} do PC! (+${pontosDisputados} ${pontosDisputados === 1 ? "pt" : "pts"})`;
  } else if (forcaJogador < forcaPc) {
    // Acertou a conta, mas a carta do PC era mais forte
    estadoJogo.pontosPc += pontosDisputados;
    titulo = "Conta certa, mas carta mais fraca";
    mensagem = `Você acertou (${desafio.explicacao}), porém o ${cartaPc.valor}${cartaPc.naipe.simbolo} do PC é mais forte que o seu ${cartaJog.valor}${cartaJog.naipe.simbolo}. O PC marcou ${pontosDisputados} ${pontosDisputados === 1 ? "pt" : "pts"}.`;
  } else {
    // Empate exato de força (cangou)
    titulo = "Empate na mesa!";
    mensagem = `Você acertou (${desafio.explicacao}), e as duas cartas (${cartaJog.valor} e ${cartaPc.valor}) têm a mesma força. Ninguém pontuou!`;
  }

  atualizarPlacarVisual();
  el.tituloFeedback.textContent = titulo;
  el.textoFeedback.textContent = mensagem;
  mostrarPainel("feedback");
}

function avancarOuEncerrar() {
  const alguemBateuMeta =
    estadoJogo.pontosJogador >= PONTOS_PARA_VENCER ||
    estadoJogo.pontosPc >= PONTOS_PARA_VENCER;

  if (alguemBateuMeta || estadoJogo.rodadaAtual >= MAXIMO_RODADAS) {
    encerrarPartida();
  } else {
    estadoJogo.rodadaAtual += 1;
    prepararRodada();
  }
}

function encerrarPartida() {
  estadoJogo.jogoAtivo = false;
  const tempoEmMs = Date.now() - estadoJogo.tempoInicio;

  let tituloFinal = "";
  if (estadoJogo.pontosJogador > estadoJogo.pontosPc) {
    tituloFinal = "Parabéns! Você venceu o Truco Matemático!";
  } else if (estadoJogo.pontosJogador < estadoJogo.pontosPc) {
    tituloFinal = "O PC venceu desta vez!";
  } else {
    tituloFinal = "Partida empatada!";
  }

  el.tituloFim.textContent = tituloFinal;
  el.resumoFim.textContent = `Placar final: Você ${estadoJogo.pontosJogador} x ${estadoJogo.pontosPc} PC.`;
  el.maoCartas.innerHTML = "";
  mostrarPainel("fim");

  // Envia resultado final para o portal da escola
  window.parent.postMessage(
    {
      type: "vrgame:finish",
      score: estadoJogo.pontosJogador,
      maxScore: PONTOS_PARA_VENCER,
      timeMs: tempoEmMs,
      detail: { jogo: "truco-matematico" }
    },
    "*"
  );
}

// --- EVENTOS DE CLIQUE ---

document.getElementById("btn-iniciar").addEventListener("click", iniciarNovaPartida);
el.btnTruco.addEventListener("click", pedirTruco);
document.getElementById("btn-proxima").addEventListener("click", avancarOuEncerrar);
document.getElementById("btn-reiniciar").addEventListener("click", iniciarNovaPartida);

el.btnTema.addEventListener("click", () => {
  const temaEscuroAtivo = document.documentElement.getAttribute("data-theme") === "dark";
  aplicarTema(temaEscuroAtivo ? "light" : "dark");
});