export const topicCategories = [
    {
        id: 'atendimento',
        label: 'Atendimento',
        icon: 'fa-headset',
        topics: [
            '✅ INÍCIO DE ATENDIMENTO',
            '🧾 IDENTIFICAÇÃO DO CLIENTE',
            '🔚 ENCERRAMENTOS',
            '📋 MENSAGENS PADRÕES',
        ],
    },
    {
        id: 'financeiro',
        label: 'Financeiro',
        icon: 'fa-wallet',
        topics: [
            '💰 FATURAS E BOLETOS',
            '💲 PREÇOS E TAXAS',
            '📉 DESCONTO:',
        ],
    },
    {
        id: 'planos',
        label: 'Planos',
        icon: 'fa-tags',
        topics: [
            '📱 PLANOS DISPONÍVEIS',
            '📱 PLANOS DISPONÍVEIS ( Muqui )',
            '📱 PLANOS DISPONÍVEIS ( Mimoso )',
            '📱 INTERNET MÓVEL',
        ],
    },
    {
        id: 'cadastro',
        label: 'Cadastro',
        icon: 'fa-user-plus',
        topics: [
            '🏔️ MINAS – INSTALAÇÃO GRATUITA',
            '📍 MARICÁ – INSTALAÇÃO PAGA',
            '📝 CADASTRO DEMAIS FILIAIS',
            '📄 ACORDO DE CONTRATAÇÃO',
        ],
    },
    {
        id: 'ixc',
        label: 'IXC / Sistema',
        icon: 'fa-server',
        topics: [
            '🏢 FILIAIS E SETORES',
            '📦 PLANOS DE VENDA (IDS)',
            '📄 CADASTRO NO IXC',
        ],
    },
    {
        id: 'suporte',
        label: 'Suporte',
        icon: 'fa-screwdriver-wrench',
        topics: [
            '🔧 SUPORTE / PROCEDIMENTOS:',
            '⚠️ PROBLEMA EXTERNO',
            '🖥️ CONFIGURAÇÃO DO ROTEADOR:',
            '📑 PADRÃO DE ABERTURA DE O.S:',
        ],
    },
    {
        id: 'cancelamento',
        label: 'Cancelamento',
        icon: 'fa-ban',
        topics: [
            '❌ CANCELAMENTO:',
        ],
    },
    {
        id: 'informacoes',
        label: 'Informações',
        icon: 'fa-circle-info',
        topics: [
            '📍 ENDEREÇOS DAS LOJAS:',
            '📲 WHATSAPP E LINKS ÚTEIS:',
        ],
    },
    {
        id: 'tecnico',
        label: 'Técnico',
        icon: 'fa-key',
        topics: [
            '🔑 SENHAS PADRÕES:',
            '⚙️ HABILITANDO ONU',
        ],
    },
];

export const readOnlyTopics = new Set([
    '⚙️ HABILITANDO ONU',
]);
