// Cache de canais de campanha para broadcast de rolagens
const campanhaDiceChannels = {};

async function getCampanhaDiceChannel(campanhaId) {
    if (!window.supabase || !campanhaId) return null;
    if (campanhaDiceChannels[campanhaId]) return campanhaDiceChannels[campanhaId];

    const channel = supabase.channel(`campanha-dados-${campanhaId}`);
    campanhaDiceChannels[campanhaId] = channel;
    await channel.subscribe();
    return channel;
}

// ============================================
// SISTEMA DE DADOS (DICE ROLLS)
// ============================================

/**
 * Rola um ou mais dados e retorna o resultado
 * @param {Array} dados - Array com objetos {quantidade, lados, bonus}
 * @returns {Object} { total, detalhes, resultado_formatado }
 */
function rolarDados(dados) {
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
        return {
            success: false,
            total: 0,
            detalhes: [],
            resultado_formatado: 'Nenhum dado para rolar'
        };
    }

    let totalRolagens = 0;
    const detalhes = [];
    const partes = [];

    dados.forEach(d => {
        const quantidade = parseInt(d.quantidade) || 1;
        const lados = parseInt(d.lados) || 20;
        const bonus = parseInt(d.bonus) || 0;
        const resultadosDeste = [];

        for (let i = 0; i < quantidade; i++) {
            const resultado = Math.floor(Math.random() * lados) + 1;
            totalRolagens += resultado;
            detalhes.push({ lados, resultado });
            resultadosDeste.push(resultado);
        }

        const bonusText = bonus ? (bonus > 0 ? ` + ${bonus}` : ` - ${Math.abs(bonus)}`) : '';
        partes.push(`${quantidade}d${lados}[${resultadosDeste.join(', ')}]${bonusText}`);
    });

    const totalBonus = dados.reduce((acc, d) => acc + (parseInt(d.bonus) || 0), 0);
    const total = totalRolagens + totalBonus;
    const resultado_formatado = `${partes.join(' + ')} = ${total}`;

    return {
        success: true,
        total,
        detalhes,
        resultado_formatado
    };
}

/**
 * Cria HTML de um botão para rolar dados (modo único)
 */
function criarBotaoRolarDados(dados, tipo, nome) {
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
        return '';
    }

    const descricaoDados = formatarDados(dados);

    return `
        <button
            onclick="rolarDadosUI('${tipo}', '${nome}', ${JSON.stringify(dados).replace(/"/g, '&quot;')})"
            style="
                width: 100%;
                padding: 8px 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 700;
                font-size: 14px;
                margin-top: 6px;
                transition: transform 0.15s, box-shadow 0.15s;
            "
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 0 10px rgba(102, 126, 234, 0.45)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
        >
            🎲 Rolar (${descricaoDados})
        </button>
    `;
}

/**
 * Cria um bloco com botões de rolagem: um para todos e um por grupo de dado
 */
function renderBotoesDados(dados, tipo, nome) {
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
        return '';
    }

    const descricaoTotal = formatarDados(dados);

    const botaoTodos = `
        <button
            onclick="rolarDadosUI('${tipo}', '${nome}', ${JSON.stringify(dados).replace(/"/g, '&quot;')})"
            style="
                flex: 1 1 180px;
                padding: 8px 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 700;
                font-size: 14px;
                transition: transform 0.15s, box-shadow 0.15s;
            "
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 0 10px rgba(102, 126, 234, 0.5)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
        >
            🎲 Rolar Todos (${descricaoTotal})
        </button>
    `;

    const botoesIndividuais = dados.map((dado) => {
        const quantidade = parseInt(dado.quantidade) || 1;
        const lados = parseInt(dado.lados) || 20;
        const bonus = parseInt(dado.bonus) || 0;
        const labelBonus = bonus ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : '';
        const label = `${quantidade}d${lados}${labelBonus}`;
        const payload = JSON.stringify([{ quantidade, lados, bonus }]).replace(/"/g, '&quot;');
        return `
            <button
                onclick="rolarDadosUI('${tipo}', '${nome} - ${label}', ${payload})"
                style="
                    flex: 1 1 140px;
                    padding: 8px 10px;
                    background: #16213e;
                    color: #e0e0e0;
                    border: 1px solid #667eea;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13px;
                    transition: transform 0.15s, box-shadow 0.15s;
                "
                onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 0 8px rgba(102, 126, 234, 0.35)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
            >
                🎲 ${label}
            </button>
        `;
    }).join('');

    return `
        <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; align-items: stretch;">
            ${botaoTodos}
            ${botoesIndividuais}
        </div>
    `;
}

/**
 * UI: rola dados, dispara evento e loga resultado (sem overlay)
 */
async function rolarDadosUI(tipo, nome, dados) {
    const resultado = rolarDados(dados);

    if (!resultado.success) {
        alert('Erro ao rolar dados: ' + resultado.resultado_formatado);
        return;
    }

    document.dispatchEvent(new CustomEvent('diceRolled', {
        detail: { tipo, nome, dados, resultado }
    }));

    // Broadcast opcional para campanha ativa
    try {
        // Priorizar campanha definida na variável global (para fichas abertas fora do contexto de campanha)
        // Se não houver, tentar pegar do localStorage (navegação do narrador/jogador na tela de campanha)
        const campanhaAtiva = window.currentCampanhaId || localStorage.getItem('campanha-atual');

        if (campanhaAtiva) {
            const channel = await getCampanhaDiceChannel(campanhaAtiva);
            if (channel) {
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                const jogador = user?.username || user?.email || 'Jogador';
                const personagem = (window.fichaData && window.fichaData.nome) ? window.fichaData.nome : 'Personagem';
                await channel.send({
                    type: 'broadcast',
                    event: 'dice-roll',
                    payload: {
                        campanhaId: campanhaAtiva,
                        tipo,
                        nome,
                        dados,
                        total: resultado.total,
                        detalhes: resultado.resultado_formatado,
                        jogador,
                        personagem,
                        timestamp: Date.now()
                    }
                });
            }
        }
    } catch (err) {
        console.warn('Falha ao broadcast de dados da campanha:', err);
    }

    // Feedback leve via console; histórico faz a exibição principal
    console.log(`🎲 ${nome} (${tipo}): ${resultado.resultado_formatado}`);
}

/**
 * Converte array de dados para string legível
 * @param {Array} dados - Array com objetos {quantidade, lados, bonus}
 * @returns {String} Exemplo: "1d20+5 + 2d8-1 + 1d100"
 */
function formatarDados(dados) {
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
        return 'Nenhum dado';
    }
    return dados
        .map(d => {
            const quantidade = parseInt(d.quantidade) || 1;
            const lados = parseInt(d.lados) || 20;
            const bonus = parseInt(d.bonus) || 0;
            const bonusLabel = bonus ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : '';
            return `${quantidade}d${lados}${bonusLabel}`;
        })
        .join(' + ');
}

/**
 * Valida se os dados estão no formato correto
 * @param {Array} dados - Array com objetos {quantidade, lados, bonus}
 * @returns {Boolean}
 */
function validarDados(dados) {
    if (!Array.isArray(dados)) return false;
    return dados.every(d => {
        const quantidade = parseInt(d.quantidade);
        const lados = parseInt(d.lados);
        return quantidade > 0 && quantidade <= 100 && lados > 0 && lados <= 1000;
    });
}
