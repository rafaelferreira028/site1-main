import { supabaseClient } from '../config/supabaseClient.js';

export async function exportarPDFEstoqueOficial() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("Biblioteca jsPDF não carregada na página.");
    }

    const { data: matData, error } = await supabaseClient
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
    doc.text("REDE DE COMBATE AO CÂNCER DE CATANDUVA", 14, 12);

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
