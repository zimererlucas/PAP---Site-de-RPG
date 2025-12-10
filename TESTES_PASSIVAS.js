// ============================================
// TESTES DE PASSIVAS - ABRIR CONSOLE (F12)
// ============================================

/**
 * TESTE 1: Verificar se as funções existem
 */
async function testeVerificacaoFuncoes() {
    console.group('✅ TESTE 1: Verificar se funções existem');
    console.log('adicionarPassiva:', typeof adicionarPassiva === 'function' ? '✅' : '❌');
    console.log('obterPassivas:', typeof obterPassivas === 'function' ? '✅' : '❌');
    console.log('obterPassiva:', typeof obterPassiva === 'function' ? '✅' : '❌');
    console.log('atualizarPassiva:', typeof atualizarPassiva === 'function' ? '✅' : '❌');
    console.log('deletarPassiva:', typeof deletarPassiva === 'function' ? '✅' : '❌');
    console.log('ativarPassiva:', typeof ativarPassiva === 'function' ? '✅' : '❌');
    console.log('desativarPassiva:', typeof desativarPassiva === 'function' ? '✅' : '❌');
    console.log('recalcularBonusGlobais:', typeof recalcularBonusGlobais === 'function' ? '✅' : '❌');
    console.groupEnd();
}

/**
 * TESTE 2: Adicionar uma passiva de teste
 */
async function testeAdicionarPassiva() {
    console.group('✅ TESTE 2: Adicionar passiva de teste');
    const fichaId = window.fichaIdGlobal || 'seu-id-aqui';
    
    const resultado = await adicionarPassiva(fichaId, {
        nome: 'Teste de Passiva',
        categoria: 'Teste',
        efeito: 'Efeito de teste',
        bonus: [
            { atributo: 'forca_bonus', valor: 5 },
            { atributo: 'agilidade_bonus', valor: 3 }
        ],
        descricao: 'Passiva de teste para validar o sistema'
    });
    
    console.log('Resultado:', resultado);
    console.groupEnd();
    return resultado;
}

/**
 * TESTE 3: Obter todas as passivas
 */
async function testeObterPassivas() {
    console.group('✅ TESTE 3: Obter todas as passivas');
    const fichaId = window.fichaIdGlobal || 'seu-id-aqui';
    
    const resultado = await obterPassivas(fichaId);
    console.log('Passivas encontradas:', resultado.data.length);
    console.log('Dados:', resultado.data);
    console.groupEnd();
    return resultado;
}

/**
 * TESTE 4: Ativar uma passiva
 */
async function testeAtivarPassiva() {
    console.group('✅ TESTE 4: Ativar passiva');
    const fichaId = window.fichaIdGlobal || 'seu-id-aqui';
    
    // Obter a primeira passiva
    const passivas = await obterPassivas(fichaId);
    if (passivas.data.length === 0) {
        console.warn('Nenhuma passiva encontrada para ativar');
        console.groupEnd();
        return;
    }
    
    const nomePassiva = passivas.data[0].nome;
    const resultado = await ativarPassiva(fichaId, nomePassiva);
    console.log('Resultado:', resultado);
    console.groupEnd();
    return resultado;
}

/**
 * TESTE 5: Recalcular bônus globais
 */
async function testeRecalcularBonus() {
    console.group('✅ TESTE 5: Recalcular bônus globais');
    const fichaId = window.fichaIdGlobal || 'seu-id-aqui';
    
    const resultado = await recalcularBonusGlobais(fichaId);
    console.log('Bônus totais:', resultado.bonusTotal);
    console.groupEnd();
    return resultado;
}

/**
 * TESTE 6: Deletar a passiva de teste
 */
async function testeDeletarPassiva() {
    console.group('✅ TESTE 6: Deletar passiva de teste');
    const fichaId = window.fichaIdGlobal || 'seu-id-aqui';
    
    // Obter a passiva 'Teste de Passiva'
    const passivas = await obterPassivas(fichaId);
    const testePassiva = passivas.data.find(p => p.nome === 'Teste de Passiva');
    
    if (!testePassiva) {
        console.warn('Passiva de teste não encontrada');
        console.groupEnd();
        return;
    }
    
    const resultado = await deletarPassiva(fichaId, testePassiva.id);
    console.log('Resultado:', resultado);
    console.groupEnd();
    return resultado;
}

/**
 * TESTE 7: Verificar JSON parsing seguro
 */
async function testeJSONParsing() {
    console.group('✅ TESTE 7: Verificar JSON parsing seguro');
    
    // Simular dados corrompidos
    const testCases = [
        { input: '[]', description: 'Array vazio válido' },
        { input: '[{"id":"1","nome":"Test"}]', description: 'JSON válido' },
        { input: 'asda', description: 'JSON inválido (deve retornar array vazio)' },
        { input: '', description: 'String vazia (deve retornar array vazio)' },
        { input: null, description: 'Null (deve retornar array vazio)' }
    ];
    
    testCases.forEach(testCase => {
        try {
            const result = JSON.parse(testCase.input || '[]');
            console.log(`✅ ${testCase.description}:`, result);
        } catch (e) {
            console.log(`⚠️ ${testCase.description}: Erro capturado (esperado)`, e.message);
        }
    });
    
    console.groupEnd();
}

/**
 * TESTE 8: Verificar estrutura de dados
 */
async function testeEstruturaDados() {
    console.group('✅ TESTE 8: Verificar estrutura de dados no banco');
    const fichaId = window.fichaIdGlobal || 'seu-id-aqui';
    
    const { data: personagem } = await supabase
        .from('personagens')
        .select('passiva, passivas_ativas')
        .eq('id', fichaId)
        .single();
    
    console.log('Coluna passiva (JSONB):', personagem.passiva);
    console.log('Coluna passivas_ativas (ARRAY):', personagem.passivas_ativas);
    console.groupEnd();
}

/**
 * EXECUTAR TODOS OS TESTES
 */
async function executarTodosTestes() {
    console.log('🚀 INICIANDO TESTES DE PASSIVAS...\n');
    
    await testeVerificacaoFuncoes();
    console.log('\n');
    
    await testeJSONParsing();
    console.log('\n');
    
    await testeEstruturaDados();
    console.log('\n');
    
    const adicionar = await testeAdicionarPassiva();
    console.log('\n');
    
    if (adicionar.success) {
        const obter = await testeObterPassivas();
        console.log('\n');
        
        const ativar = await testeAtivarPassiva();
        console.log('\n');
        
        const bonus = await testeRecalcularBonus();
        console.log('\n');
        
        const deletar = await testeDeletarPassiva();
        console.log('\n');
    }
    
    console.log('✅ TESTES CONCLUÍDOS');
}

// Para executar os testes, copie e cole no console (F12):
// executarTodosTestes();
