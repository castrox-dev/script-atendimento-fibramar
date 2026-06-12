export const ixcReferenceTopics = {
    '🏢 FILIAIS E SETORES': {
        type: 'ixc-reference',
        sections: [
            {
                title: 'FILIAIS / CIDADE',
                description: 'Clique no ID para copiar',
                items: [
                    { label: 'MARICÁ', copyValue: '2' },
                    { label: 'MINAS GERAIS', copyValue: '6' },
                    { label: 'JACONÉ / UNAMAR / SAQUAREMA / ARARUAMA', copyValue: '7' },
                    { label: 'MUQUI / MIMOSO DO SUL', copyValue: '8' },
                    { label: 'VILA VELHA / PIÚMA', copyValue: '9' },
                    { label: 'SÃO PAULO', copyValue: '11' },
                ],
            },
            {
                title: 'SETORES',
                description: 'Clique no ID para copiar',
                items: [
                    { label: 'MARICÁ', copyValue: '1' },
                    { label: 'MINAS', copyValue: '22' },
                    { label: 'JACONÉ / UNAMAR / SAQUAREMA / ARARUAMA', copyValue: '23' },
                    { label: 'MUQUI / MIMOSO', copyValue: '24' },
                    { label: 'VILA VELHA / PIÚMA', copyValue: '21' },
                    { label: 'SÃO PAULO', copyValue: '26' },
                ],
            },
        ],
    },
    '📦 PLANOS DE VENDA (IDS)': {
        type: 'ixc-reference',
        sections: [
            {
                title: 'FILIAL 2',
                items: [
                    { label: '240MB', copyValue: '174' },
                    { label: '400MB', copyValue: '175' },
                    { label: '600MB', copyValue: '124' },
                    { label: '700MB', copyValue: '537' },
                    { label: '1GB', copyValue: '560' },
                ],
            },
            {
                title: 'FILIAL 6, 7 E 11',
                items: [
                    { label: '240MB', copyValue: '174' },
                    { label: '400MB', copyValue: '175' },
                    { label: '500MB', copyValue: '176' },
                    { label: '600MB', copyValue: '124' },
                    { label: '1GB', copyValue: '560' },
                ],
            },
            {
                title: 'FILIAL 8 MIMOSO',
                items: [
                    { label: '100MB', copyValue: '220' },
                    { label: '240MB', copyValue: '174' },
                    { label: '300MB', copyValue: '562' },
                    { label: '400MB', copyValue: '175' },
                    { label: '500MB', copyValue: '176' },
                    { label: '600MB', copyValue: '124' },
                    { label: '700MB', copyValue: '563' },
                    { label: '1GB', copyValue: '560' },
                ],
            },
        ],
    },
    '📄 CADASTRO NO IXC': {
        type: 'ixc-reference',
        sections: [
            {
                title: 'TIPO DE DOCUMENTO DA FATURA',
                text: 'Sempre utilizar o ID abaixo:',
                items: [{ label: 'Tipo de documento fatura', copyValue: '501' }],
            },
            {
                title: 'TIPO DE DOCUMENTO OPCIONAL',
                description: 'Clique no ID para copiar',
                items: [
                    { label: 'Filial 02', copyValue: '702' },
                    { label: 'Filial 07', copyValue: '703' },
                    { label: 'Filial 06', copyValue: '704' },
                    { label: 'Filial 08', copyValue: '705' },
                    { label: 'Filial 11', copyValue: '706' },
                    { label: 'Filial 09', copyValue: '707' },
                ],
            },
            {
                title: 'FIDELIDADE',
                text: 'De acordo com a escolha do cliente: 12 meses ou deixar vazio.',
            },
            {
                title: 'VENDEDOR E RESPONSÁVEL',
                text: 'O ID do vendedor e do responsável fica registrado no sistema IXC conforme o cadastro interno da equipe.',
            },
            {
                title: 'TAXA DE ATIVAÇÃO (INSTALAÇÃO R$ 100,00)',
                text: 'Quando o cliente pagar a instalação de R$ 100,00, utilize os IDs abaixo:',
                items: [
                    { label: 'Tipo de documento', copyValue: '501' },
                    { label: 'Produto instalação R$ 100,00', copyValue: '146' },
                ],
            },
        ],
    },
};
