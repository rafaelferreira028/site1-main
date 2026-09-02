async function exportarPDFEstoqueOficial() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("Biblioteca jsPDF não carregada na página.");
    }

    const { data: matData, error } = await window.supabaseClient
        .from('doacoes_materiais')
        .select('*, categorias_itens(nome_categoria)')
        .order('id_categoria', { ascending: true });

    if (error) throw error;
    const materiais = matData || [];

    if (materiais.length === 0) {
        return { success: false, message: "Não há itens em estoque para gerar o relatório em PDF." };
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Cabeçalho Institucional
    doc.setFillColor(225, 29, 72); // rose-600
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REDE DE COMBATE AO CÂNCER", 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("RELATÓRIO OFICIAL DE ITENS E MATERIAIS EM ESTOQUE", 14, 18);

    doc.setFontSize(9);
    doc.text(`Gerado em: ${dataFormatada} às ${horaFormatada}`, 283, 15, { align: 'right' });

    // 2. Resumo de Métricas (Cards no PDF)
    const totalItens = materiais.reduce((acc, m) => acc + parseInt(m.quantidade || 0), 0);
    const totalBazar = materiais.filter(m => m.destino_item === 'Bazar' || m.id_categoria === 6).reduce((acc, m) => acc + parseInt(m.quantidade || 0), 0);
    const totalAlimentos = materiais.filter(m => m.id_categoria === 2).reduce((acc, m) => acc + parseInt(m.quantidade || 0), 0);
    const totalHigiene = materiais.filter(m => m.id_categoria === 3).reduce((acc, m) => acc + parseInt(m.quantidade || 0), 0);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 28, 269, 14, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`TOTAL GERAL: ${totalItens} itens`, 20, 36.5);
    doc.text(`BAZAR: ${totalBazar} un.`, 90, 36.5);
    doc.text(`ALIMENTOS: ${totalAlimentos} un.`, 150, 36.5);
    doc.text(`HIGIENE: ${totalHigiene} un.`, 220, 36.5);

    // 3. Tabela Consolidada de Itens
    const grupos = {};
    materiais.forEach(item => {
        const catNome = item.categorias_itens ? item.categorias_itens.nome_categoria : 'Geral';
        const key = `${item.descricao_item.trim().toLowerCase()}_${catNome.toLowerCase()}_${item.destino_item.toLowerCase()}_${item.unidade_medida.toLowerCase()}`;
        if (!grupos[key]) {
            grupos[key] = {
                descricao: item.descricao_item,
                categoria: catNome,
                quantidade: 0,
                unidade: item.unidade_medida,
                estado: item.estado_conservacao || 'Não se aplica',
                destino: item.destino_item
            };
        }
        grupos[key].quantidade += parseInt(item.quantidade || 0);
    });

    const tableRows = Object.values(grupos).map((g, index) => [
        index + 1,
        g.descricao,
        g.categoria,
        g.quantidade,
        g.unidade,
        g.estado,
        g.destino
    ]);

    doc.autoTable({
        startY: 46,
        head: [['#', 'Descrição do Item / Material', 'Categoria', 'Qtd Disponível', 'Unidade', 'Estado Conservação', 'Destino Atual']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
            fillColor: [225, 29, 72],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 85, fontStyle: 'bold' },
            2: { cellWidth: 50 },
            3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
            4: { cellWidth: 25 },
            5: { cellWidth: 34 },
            6: { cellWidth: 35 }
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: [30, 41, 59]
        },
        alternateRowStyles: {
            fillColor: [252, 252, 253]
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function (data) {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Página ${data.pageNumber} de ${pageCount}`, 283, 202, { align: 'right' });
            doc.text(`Rede de Combate ao Câncer - Sistema de Gestão de Doações e Estoque`, 14, 202);
        }
    });

    const nomeArquivo = `Relatorio_Estoque_RedeCombateCancer_${dataFormatada.replace(/\//g, '-')}.pdf`;
    doc.save(nomeArquivo);

    return { success: true, filename: nomeArquivo };
}

async function exportarPDFDoacoesOficial() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("Biblioteca jsPDF não carregada na página.");
    }

    const { data: doaData, error } = await window.doacoesService.buscarDoacoesAdmin();
    if (error) throw error;
    const doacoes = doaData || [];

    if (doacoes.length === 0) {
        return { success: false, message: "Não há registros de doações para gerar o relatório em PDF." };
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Cabeçalho Institucional
    doc.setFillColor(225, 29, 72); // rose-600
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REDE DE COMBATE AO CÂNCER", 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("RELATÓRIO GERAL DE DOAÇÕES E DOADORES", 14, 18);

    doc.setFontSize(9);
    doc.text(`Gerado em: ${dataFormatada} às ${horaFormatada}`, 283, 15, { align: 'right' });

    // 2. Resumo de Métricas
    let totalFin = 0;
    let totalMatQtd = 0;
    const doadoresSet = new Set();

    doacoes.forEach(d => {
        if (d.doadores && d.doadores.nome) doadoresSet.add(d.doadores.nome);
        if (d.doacoes_financeiras && d.doacoes_financeiras.length > 0) {
            d.doacoes_financeiras.forEach(f => { totalFin += parseFloat(f.valor || 0); });
        }
        if (d.doacoes_materiais && d.doacoes_materiais.length > 0) {
            d.doacoes_materiais.forEach(m => { totalMatQtd += parseInt(m.quantidade || 0); });
        }
    });

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 28, 269, 14, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`TOTAL DOAÇÕES: ${doacoes.length}`, 20, 36.5);
    doc.text(`DOADORES ÚNICOS: ${doadoresSet.size}`, 85, 36.5);
    doc.text(`TOTAL FINANCEIRO: R$ ${totalFin.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 150, 36.5);
    doc.text(`TOTAL MATERIAIS: ${totalMatQtd} itens`, 230, 36.5);

    // 3. Tabela Consolidada de Doações
    const tableRows = doacoes.map((d, index) => {
        const nomeDoador = d.doadores ? d.doadores.nome : 'Doador Desconhecido';
        const dataDoacaoFmt = d.data_doacao ? new Date(d.data_doacao).toLocaleDateString('pt-BR') : '-';
        
        const detalhesArr = [];
        if (d.doacoes_financeiras && d.doacoes_financeiras.length > 0) {
            d.doacoes_financeiras.forEach(f => {
                const compStr = f.comprovante_transacao ? ` (Nº ${f.comprovante_transacao})` : '';
                detalhesArr.push(`[Fin] R$ ${parseFloat(f.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${compStr}`);
            });
        }
        if (d.doacoes_materiais && d.doacoes_materiais.length > 0) {
            d.doacoes_materiais.forEach(m => {
                detalhesArr.push(`[Mat] ${m.descricao_item} - ${m.quantidade} ${m.unidade_medida} (${m.destino_item || 'Estoque'})`);
            });
        }

        const conteudoDoado = detalhesArr.join(' | ') || 'Sem detalhes';

        return [
            index + 1,
            nomeDoador,
            dataDoacaoFmt,
            d.canal_recebimento || 'Presencial',
            conteudoDoado,
            d.observacoes || '-'
        ];
    });

    doc.autoTable({
        startY: 46,
        head: [['#', 'Doador', 'Data', 'Canal', 'O que foi doado (Valores e Itens)', 'Observações']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
            fillColor: [225, 29, 72],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 55, fontStyle: 'bold' },
            2: { cellWidth: 22, halign: 'center' },
            3: { cellWidth: 30 },
            4: { cellWidth: 102 },
            5: { cellWidth: 50 }
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: [30, 41, 59]
        },
        alternateRowStyles: {
            fillColor: [252, 252, 253]
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function (data) {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Página ${data.pageNumber} de ${pageCount}`, 283, 202, { align: 'right' });
            doc.text(`Rede de Combate ao Câncer - Sistema de Gestão de Doações e Estoque`, 14, 202);
        }
    });

    const nomeArquivo = `Relatorio_Doacoes_RedeCombateCancer_${dataFormatada.replace(/\//g, '-')}.pdf`;
    doc.save(nomeArquivo);

    return { success: true, filename: nomeArquivo };
}

window.pdfService = {
    exportarPDFEstoqueOficial,
    exportarPDFDoacoesOficial
};
