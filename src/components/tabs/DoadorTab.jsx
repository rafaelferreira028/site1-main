const { useState, useEffect } = React;

function DoadorTab({ isVisible, onDoadorCadastrado, onLoadingStart, onLoadingEnd }) {
    const { mostrarToast } = window.useToast();

    const [nome, setNome] = useState('');
    const [tipoDoador, setTipoDoador] = useState('PF');
    const [documento, setDocumento] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [cidade, setCidade] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [isVisible, tipoDoador]);

    if (!isVisible) return null;

    const resetForm = () => {
        setNome('');
        setTipoDoador('PF');
        setDocumento('');
        setTelefone('');
        setEmail('');
        setCidade('');
        setDataNascimento('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (onLoadingStart) onLoadingStart();

        const novoDoador = {
            nome,
            tipo_doador: tipoDoador,
            documento: documento || null,
            telefone: telefone || null,
            email: email || null,
            cidade: cidade || null,
            data_nascimento: dataNascimento || null
        };

        try {
            const { data, error } = await window.doadoresService.criarDoador(novoDoador);
            if (error) {
                mostrarToast('Erro ao salvar doador: ' + error.message, 'error');
            } else {
                mostrarToast('Doador cadastrado com sucesso!', 'success');
                resetForm();
                if (onDoadorCadastrado) onDoadorCadastrado();
            }
        } catch (err) {
            mostrarToast('Erro ao salvar doador: ' + err.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    return (
        <div id="tab-doador" className="tab-content active visible bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i data-lucide="user-plus" className="text-rose-600"></i> Cadastrar Novo Doador
            </h2>
            <form id="form-doador" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nome Completo / Razão Social *</label>
                    <input
                        type="text"
                        id="doador-nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        placeholder="Ex: Maria da Silva ou Empresa XYZ Ltda"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tipo de Doador *</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/80 h-[42px] items-center">
                            <button
                                type="button"
                                id="btn-doador-pf"
                                onClick={() => { setTipoDoador('PF'); setDocumento(window.formatarDocumento(documento, 'PF')); }}
                                className={`flex-1 h-full text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${tipoDoador === 'PF' ? 'bg-white shadow-xs text-rose-600' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                <i data-lucide="user" className="w-4 h-4"></i> Pessoa Física (PF)
                            </button>
                            <button
                                type="button"
                                id="btn-doador-pj"
                                onClick={() => { setTipoDoador('PJ'); setDocumento(window.formatarDocumento(documento, 'PJ')); }}
                                className={`flex-1 h-full text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${tipoDoador === 'PJ' ? 'bg-white shadow-xs text-rose-600' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                <i data-lucide="building-2" className="w-4 h-4"></i> Pessoa Jurídica (PJ)
                            </button>
                        </div>
                        <input type="hidden" id="doador-tipo" value={tipoDoador} />
                    </div>

                    <div>
                        <label id="label-doador-documento" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            {tipoDoador === 'PF' ? 'CPF *' : 'CNPJ *'}
                        </label>
                        <input
                            type="text"
                            id="doador-documento"
                            value={documento}
                            onChange={(e) => setDocumento(window.formatarDocumento(e.target.value, tipoDoador))}
                            maxLength={tipoDoador === 'PF' ? 14 : 18}
                            placeholder={tipoDoador === 'PF' ? "000.000.000-00" : "00.000.000/0000-00"}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
                        <input
                            type="tel"
                            id="doador-telefone"
                            value={telefone}
                            onChange={(e) => setTelefone(window.formatarTelefone(e.target.value))}
                            maxLength={15}
                            placeholder="Ex: (44) 99999-9999"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">E-mail</label>
                        <input
                            type="email"
                            id="doador-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ex: maria.silva@email.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Cidade / UF</label>
                        <input
                            type="text"
                            id="doador-cidade"
                            value={cidade}
                            onChange={(e) => setCidade(e.target.value)}
                            placeholder="Ex: Astorga - PR"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Data de Nascimento / Fundação</label>
                        <input
                            type="date"
                            id="doador-data-nascimento"
                            value={dataNascimento}
                            onChange={(e) => setDataNascimento(e.target.value)}
                            max="9999-12-31"
                            min="1900-01-01"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        className="bg-rose-600 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:bg-rose-700 transition duration-150 cursor-pointer flex items-center gap-2"
                    >
                        <i data-lucide="save" className="w-5 h-5"></i> Salvar Doador
                    </button>
                </div>
            </form>
        </div>
    );
}

window.DoadorTab = DoadorTab;
