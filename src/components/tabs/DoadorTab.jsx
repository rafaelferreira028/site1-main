const { useState, useEffect } = React;

function DoadorTab({ isVisible, onDoadorCadastrado, onLoadingStart, onLoadingEnd }) {
    const { mostrarToast } = window.useToast();

    const [nome, setNome] = useState('');
    const [tipoDoador, setTipoDoador] = useState('PF');
    const [documento, setDocumento] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [cep, setCep] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cidade, setCidade] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [isBuscaCepLoading, setIsBuscaCepLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [isVisible, tipoDoador, isBuscaCepLoading, isSubmitting]);

    if (!isVisible) return null;

    const resetForm = () => {
        setNome('');
        setTipoDoador('PF');
        setDocumento('');
        setTelefone('');
        setEmail('');
        setCep('');
        setEndereco('');
        setCidade('');
        setDataNascimento('');
        setIsBuscaCepLoading(false);
        setIsSubmitting(false);
    };

    const cepSeqRef = React.useRef(0);

    const handleCepChange = async (e) => {
        const valor = e.target.value;
        const formatado = window.formatarCEP ? window.formatarCEP(valor) : valor;
        setCep(formatado);

        const cepDigitos = valor.replace(/\D/g, '');
        if (cepDigitos.length === 8) {
            const currentSeq = ++cepSeqRef.current;
            setIsBuscaCepLoading(true);
            try {
                const fnConsulta = window.consultarCEP || (typeof consultarCEP !== 'undefined' ? consultarCEP : null);
                if (fnConsulta) {
                    const res = await fnConsulta(cepDigitos);
                    if (currentSeq !== cepSeqRef.current) return;
                    if (res) {
                        if (res.error) {
                            mostrarToast(res.error, 'warning');
                        } else {
                            if (res.cidadeUf) setCidade(res.cidadeUf);
                            if (res.endereco) setEndereco(res.endereco);
                            mostrarToast('Endereço e cidade localizados com sucesso!', 'success');
                        }
                    }
                }
            } catch (err) {
                console.error("Falha ao consultar CEP:", err);
                mostrarToast('Não foi possível obter dados automáticos do CEP.', 'warning');
            } finally {
                if (currentSeq === cepSeqRef.current) {
                    setIsBuscaCepLoading(false);
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const nomeLimpo = nome ? nome.trim() : '';
        if (!nomeLimpo) {
            mostrarToast('Por favor, informe o nome ou razão social do doador.', 'error');
            return;
        }

        setIsSubmitting(true);
        if (onLoadingStart) onLoadingStart();

        const novoDoador = {
            nome: nomeLimpo,
            tipo_doador: tipoDoador,
            documento: documento ? documento.trim() : null,
            telefone: telefone ? telefone.trim() : null,
            email: email ? email.trim() : null,
            cep: cep ? cep.trim() : null,
            endereco: endereco ? endereco.trim() : null,
            cidade: cidade ? cidade.trim() : null,
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
            setIsSubmitting(false);
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
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>CEP (Busca Automática)</span>
                            {isBuscaCepLoading && <span className="text-[10px] text-rose-600 animate-pulse font-normal">Consultando API...</span>}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="doador-cep"
                                value={cep}
                                onChange={handleCepChange}
                                maxLength={9}
                                placeholder="Ex: 87000-000"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                            />
                            {isBuscaCepLoading && (
                                <div className="absolute right-3 top-3">
                                    <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Endereço / Logradouro</label>
                        <input
                            type="text"
                            id="doador-endereco"
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            placeholder="Ex: Rua das Flores, 123 - Centro"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        />
                    </div>
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
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`bg-rose-600 text-white font-bold px-6 py-3 rounded-xl shadow-md transition duration-150 flex items-center gap-2 ${
                            isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-rose-700 cursor-pointer'
                        }`}
                    >
                        <i data-lucide={isSubmitting ? "loader-2" : "save"} className={`w-5 h-5 ${isSubmitting ? "animate-spin" : ""}`}></i>
                        <span>{isSubmitting ? 'Salvando...' : 'Salvar Doador'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}

window.DoadorTab = DoadorTab;
