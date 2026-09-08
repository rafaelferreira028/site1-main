const { useState, useEffect } = React;

function EditDoadorModal({ isOpen, doador, onClose, onSave }) {
    const { mostrarToast } = window.useToast ? window.useToast() : { mostrarToast: () => {} };

    const [idDoador, setIdDoador] = useState('');
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

    useEffect(() => {
        if (doador) {
            setIdDoador(doador.id_doador || '');
            setNome(doador.nome || '');
            setTipoDoador(doador.tipo_doador || 'PF');
            setDocumento(window.formatarDocumento(doador.documento || '', doador.tipo_doador || 'PF'));
            setTelefone(window.formatarTelefone(doador.telefone || ''));
            setEmail(doador.email || '');
            setCep(doador.cep || '');
            setEndereco(doador.endereco || '');
            setCidade(doador.cidade || '');
            setDataNascimento(doador.data_nascimento || '');
            setIsBuscaCepLoading(false);
        }
    }, [doador]);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [isOpen, tipoDoador, isBuscaCepLoading]);

    if (!isOpen) return null;

    const handleCepChange = async (e) => {
        const valor = e.target.value;
        const formatado = window.formatarCEP ? window.formatarCEP(valor) : valor;
        setCep(formatado);

        const cepDigitos = valor.replace(/\D/g, '');
        if (cepDigitos.length === 8) {
            setIsBuscaCepLoading(true);
            const fnConsulta = window.consultarCEP || (typeof consultarCEP !== 'undefined' ? consultarCEP : null);
            if (fnConsulta) {
                const res = await fnConsulta(cepDigitos);
                setIsBuscaCepLoading(false);
                if (res) {
                    if (res.error) {
                        mostrarToast(res.error, 'warning');
                    } else {
                        if (res.cidadeUf) setCidade(res.cidadeUf);
                        if (res.endereco) setEndereco(res.endereco);
                        mostrarToast('Endereço e cidade localizados com sucesso!', 'success');
                    }
                }
            } else {
                setIsBuscaCepLoading(false);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            id_doador: parseInt(idDoador),
            nome,
            tipo_doador: tipoDoador,
            documento: documento || null,
            telefone: telefone || null,
            email: email || null,
            cep: cep || null,
            endereco: endereco || null,
            cidade: cidade || null,
            data_nascimento: dataNascimento || null
        });
    };

    return (
        <div id="modal-editar-doador" className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay show bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 modal-dialog show relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <i data-lucide="user-cog" className="w-5 h-5"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Editar Cadastro de Doador</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <i data-lucide="x" className="w-5 h-5"></i>
                    </button>
                </div>

                <form id="form-editar-doador" onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" id="edit-doador-id" value={idDoador} />

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nome Completo / Razão Social *</label>
                        <input
                            type="text"
                            id="edit-doador-nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tipo de Doador *</label>
                            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/80 h-[42px] items-center">
                                <button
                                    type="button"
                                    onClick={() => { setTipoDoador('PF'); setDocumento(window.formatarDocumento(documento, 'PF')); }}
                                    className={`flex-1 h-full text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${tipoDoador === 'PF' ? 'bg-white shadow-xs text-rose-600' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    <i data-lucide="user" className="w-4 h-4"></i> Pessoa Física (PF)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setTipoDoador('PJ'); setDocumento(window.formatarDocumento(documento, 'PJ')); }}
                                    className={`flex-1 h-full text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${tipoDoador === 'PJ' ? 'bg-white shadow-xs text-rose-600' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    <i data-lucide="building-2" className="w-4 h-4"></i> Pessoa Jurídica (PJ)
                                </button>
                            </div>
                            <input type="hidden" id="edit-doador-tipo" value={tipoDoador} />
                        </div>

                        <div>
                            <label id="edit-label-doador-documento" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                {tipoDoador === 'PF' ? 'CPF *' : 'CNPJ *'}
                            </label>
                            <input
                                type="text"
                                id="edit-doador-documento"
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
                                id="edit-doador-telefone"
                                value={telefone}
                                onChange={(e) => setTelefone(window.formatarTelefone(e.target.value))}
                                maxLength={15}
                                placeholder="(00) 00000-0000"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">E-mail</label>
                            <input
                                type="email"
                                id="edit-doador-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="doador@email.com"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span>CEP (Busca Automática)</span>
                                {isBuscaCepLoading && <span className="text-[10px] text-rose-600 animate-pulse font-normal">Consultando...</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="edit-doador-cep"
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
                                id="edit-doador-data-nascimento"
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
                                id="edit-doador-endereco"
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
                                id="edit-doador-cidade"
                                value={cidade}
                                onChange={(e) => setCidade(e.target.value)}
                                placeholder="Ex: Catanduva - SP"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold rounded-xl text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-2"
                        >
                            <i data-lucide="check" className="w-4 h-4"></i> Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

window.EditDoadorModal = EditDoadorModal;
