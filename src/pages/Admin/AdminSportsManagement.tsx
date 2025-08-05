import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import ConfirmationDialog from '../../components/UI/ConfirmationDialog';

// Tipos para as entidades
interface Esporte {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Modalidade {
  id: string;
  esporte_id: string;
  nome: string;
  jogadores_por_time: number;
  ativo: boolean;
  esporte_nome?: string; // Para exibição
}

interface Subcategoria {
  id: string;
  modalidade_id: string;
  nome: string;
  descricao: string;
  modalidade_nome?: string; // Para exibição
}



const AdminSportsManagement: React.FC = () => {
  // Estado para controlar qual aba está ativa
  const [activeTab, setActiveTab] = useState<'esportes' | 'modalidades' | 'subcategorias'>('esportes');
  
  // Estados para armazenar os dados
  const [esportes, setEsportes] = useState<Esporte[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [isAddingSubcategoria, setIsAddingSubcategoria] = useState(false);
const [editingSubcategoriaId, setEditingSubcategoriaId] = useState<string | null>(null);
const [selectedEsporteId, setSelectedEsporteId] = useState('');
  const [subcategoriaForm, setSubcategoriaForm] = useState<Omit<Subcategoria, 'id'>>({
    modalidade_id: '',
    nome: '',
    descricao: '',
  });
  
  // Estados para controlar a edição
  const [isAddingEsporte, setIsAddingEsporte] = useState(false);
  const [editingEsporteId, setEditingEsporteId] = useState<string | null>(null);
  const [isAddingModalidade, setIsAddingModalidade] = useState(false);
  const [editingModalidadeId, setEditingModalidadeId] = useState<string | null>(null);

  // Formulários
  const [esporteForm, setEsporteForm] = useState<Omit<Esporte, 'id'>>({
    nome: '',
    ativo: true
  });
  const [modalidadeForm, setModalidadeForm] = useState<Omit<Modalidade, 'id'>>({
    esporte_id: '',
    nome: '',
    jogadores_por_time: 0,
    ativo: true
  });
  
  // Funções para buscar dados
  const fetchEsportes = async () => {
    const { data, error } = await supabase
      .from('esportes')
      .select('*')
      .order('nome');
      
    if (error) {
      console.error('Erro ao buscar esportes:', error);
      return;
    }
    setEsportes(data || []);
  };

  const fetchModalidades = async () => {
    const { data, error } = await supabase
      .from('modalidades')
      .select('*')
      .order('nome');
    if (error) {
      console.error('Erro ao buscar modalidades:', error);
      return;
    }
    setModalidades(data || []);
  };

  const fetchSubcategorias = async () => {
    const { data, error } = await supabase
      .from('subcategorias')
      .select('*')
      .order('nome');
    if (error) {
      console.error('Erro ao buscar subcategorias:', error);
      return;
    }
    setSubcategorias(data || []);
  };

  useEffect(() => {
    fetchEsportes();
    fetchModalidades();
    fetchSubcategorias();
  }, []);
  
  // Funções para adicionar/editar/excluir
// Dialog state for deletion
const [deleteDialog, setDeleteDialog] = useState<{
  isOpen: boolean;
  type: 'esporte' | 'modalidade' | 'subcategoria' | null;
  id: string | null;
}>({ isOpen: false, type: null, id: null });

const handleDeleteEsporte = async (id: string) => {
  setDeleteDialog({ isOpen: true, type: 'esporte', id });
};
const handleDeleteModalidade = async (id: string) => {
  setDeleteDialog({ isOpen: true, type: 'modalidade', id });
};
const handleDeleteSubcategoria = async (id: string) => {
  setDeleteDialog({ isOpen: true, type: 'subcategoria', id });
};

const confirmDelete = async () => {
  if (!deleteDialog.id || !deleteDialog.type) return;
  if (deleteDialog.type === 'esporte') {
    const { error } = await supabase.from('esportes').delete().eq('id', deleteDialog.id);
    if (error) {
      alert('Erro ao excluir esporte: ' + error.message);
      setDeleteDialog({ isOpen: false, type: null, id: null });
      return;
    }
    setEsportes(esportes => esportes.filter(e => e.id !== deleteDialog.id));
  }
  if (deleteDialog.type === 'modalidade') {
    const { error } = await supabase.from('modalidades').delete().eq('id', deleteDialog.id);
    if (error) {
      alert('Erro ao excluir modalidade: ' + error.message);
      setDeleteDialog({ isOpen: false, type: null, id: null });
      return;
    }
    setModalidades(modalidades => modalidades.filter(m => m.id !== deleteDialog.id));
  }
  if (deleteDialog.type === 'subcategoria') {
    const { error } = await supabase.from('subcategorias').delete().eq('id', deleteDialog.id);
    if (error) {
      alert('Erro ao excluir subcategoria: ' + error.message);
      setDeleteDialog({ isOpen: false, type: null, id: null });
      return;
    }
    setSubcategorias(subcategorias => subcategorias.filter(s => s.id !== deleteDialog.id));
  }
  setDeleteDialog({ isOpen: false, type: null, id: null });
};

// Cancel delete
const cancelDelete = () => setDeleteDialog({ isOpen: false, type: null, id: null });

  const handleSaveModalidade = async (id: string) => {
    const { error } = await supabase
      .from('modalidades')
      .update({
        esporte_id: modalidadeForm.esporte_id,
        nome: modalidadeForm.nome,
        jogadores_por_time: modalidadeForm.jogadores_por_time,
        ativo: modalidadeForm.ativo
      })
      .eq('id', id);
    if (error) {
      alert('Erro ao salvar modalidade: ' + error.message);
      return;
    }
    setModalidades(modalidades => modalidades.map(m => m.id === id ? {
      ...m,
      esporte_id: modalidadeForm.esporte_id,
      nome: modalidadeForm.nome,
      jogadores_por_time: modalidadeForm.jogadores_por_time,
      ativo: modalidadeForm.ativo
    } : m));
    setEditingModalidadeId(null);
  };

  const handleSaveEsporte = async (id: string) => {
    const { error } = await supabase
      .from('esportes')
      .update({ nome: esporteForm.nome, ativo: esporteForm.ativo })
      .eq('id', id);
    if (error) {
      alert('Erro ao salvar esporte: ' + error.message);
      return;
    }
    setEsportes(esportes => esportes.map(e => e.id === id ? { ...e, nome: esporteForm.nome, ativo: esporteForm.ativo } : e));
    setEditingEsporteId(null);
  };

  const handleAddEsporte = async () => {
    const { data, error } = await supabase
      .from('esportes')
      .insert([esporteForm]);
      
    if (error) {
      console.error('Erro ao adicionar esporte:', error);
      return;
    }
    fetchEsportes();
    setIsAddingEsporte(false);
    setEsporteForm({ nome: '', ativo: true });
  };

  const handleAddModalidade = async () => {
    if (!modalidadeForm.esporte_id) {
      alert('Selecione o esporte da modalidade.');
      return;
    }
    const { error } = await supabase
      .from('modalidades')
      .insert([modalidadeForm]);
    if (error) {
      console.error('Erro ao adicionar modalidade:', error);
      return;
    }
    fetchModalidades();
    setIsAddingModalidade(false);
    setModalidadeForm({ esporte_id: '', nome: '', jogadores_por_time: 0, ativo: true });
  };
  
  // Função para salvar subcategoria editada
  const handleSaveSubcategoria = async (id: string) => {
    const { error } = await supabase
      .from('subcategorias')
      .update({
        modalidade_id: subcategoriaForm.modalidade_id,
        nome: subcategoriaForm.nome,
        descricao: subcategoriaForm.descricao
      })
      .eq('id', id);
    if (error) {
      alert('Erro ao salvar subcategoria: ' + error.message);
      return;
    }
    setSubcategorias(subcategorias => subcategorias.map(s => s.id === id ? {
      ...s,
      modalidade_id: subcategoriaForm.modalidade_id,
      nome: subcategoriaForm.nome,
      descricao: subcategoriaForm.descricao
    } : s));
    setEditingSubcategoriaId(null);
  };

  // Função para adicionar subcategoria
  const handleAddSubcategoria = async () => {
    if (!subcategoriaForm.modalidade_id) {
      alert('Selecione a modalidade da subcategoria.');
      return;
    }
    if (!subcategoriaForm.nome) {
      alert('Preencha o nome da subcategoria.');
      return;
    }
    const { error } = await supabase
      .from('subcategorias')
      .insert([subcategoriaForm]);
    if (error) {
      console.error('Erro ao adicionar subcategoria:', error);
      return;
    }
    fetchSubcategorias();
    setIsAddingSubcategoria(false);
    setSubcategoriaForm({ modalidade_id: '', nome: '', descricao: '' });
  };

  // Renderização das abas
  return (
    <React.Fragment>
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('esportes')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'esportes'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Esportes
          </button>
          
          <button
            onClick={() => setActiveTab('modalidades')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'modalidades'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Modalidades
          </button>
          
          <button
            onClick={() => setActiveTab('subcategorias')}
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'subcategorias'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Subcategorias
          </button>
        </nav>
      </div>
      
      {/* Conteúdo das abas */}
      <div className="p-6">
        {/* Aba de Subcategorias */}
        {activeTab === 'subcategorias' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Gerenciar Subcategorias</h2>
              <button
                onClick={() => setIsAddingSubcategoria(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Adicionar Subcategoria
              </button>
            </div>
            {/* Formulário para adicionar subcategoria */}
            {isAddingSubcategoria && (
  <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
    <h3 className="text-md font-medium mb-3">Nova Subcategoria</h3>
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Esporte</label>
        <select
          value={selectedEsporteId}
          onChange={e => {
            setSelectedEsporteId(e.target.value);
            setSubcategoriaForm(form => ({ ...form, modalidade_id: '' }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">Selecione o esporte</option>
          {esportes.map(e => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
        <select
          value={subcategoriaForm.modalidade_id}
          onChange={e => setSubcategoriaForm({ ...subcategoriaForm, modalidade_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
          disabled={!selectedEsporteId}
        >
          <option value="">Selecione a modalidade</option>
          {modalidades
            .filter(m => m.esporte_id === selectedEsporteId)
            .map(m => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
        </select>
      </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Subcategoria</label>
                    <input
                      type="text"
                      value={subcategoriaForm.nome}
                      onChange={e => setSubcategoriaForm({ ...subcategoriaForm, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={subcategoriaForm.descricao}
                      onChange={e => setSubcategoriaForm({ ...subcategoriaForm, descricao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    onClick={() => setIsAddingSubcategoria(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!subcategoriaForm.modalidade_id) {
                        alert('Selecione a modalidade da subcategoria.');
                        return;
                      }
                      if (!subcategoriaForm.nome) {
                        alert('Preencha o nome da subcategoria.');
                        return;
                      }
                      const { error } = await supabase
                        .from('subcategorias')
                        .insert([subcategoriaForm]);
                      if (error) {
                        alert('Erro ao adicionar subcategoria: ' + error.message);
                        return;
                      }
                      fetchSubcategorias();
                      setIsAddingSubcategoria(false);
                      setSubcategoriaForm({ modalidade_id: '', nome: '', descricao: '' });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
            {/* Tabela de subcategorias */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modalidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subcategorias.map(sub => {
                    const modalidade = modalidades.find(m => m.id === sub.modalidade_id);
                    return (
                      <tr key={sub.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingSubcategoriaId === sub.id ? (
                            <select
                              value={subcategoriaForm.modalidade_id}
                              onChange={e => setSubcategoriaForm({ ...subcategoriaForm, modalidade_id: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded-md w-full"
                            >
                              <option value="">Selecione a modalidade</option>
                              {modalidades.map(m => (
                                <option key={m.id} value={m.id}>{m.nome}</option>
                              ))}
                            </select>
                          ) : (
                            modalidade ? modalidade.nome : '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingSubcategoriaId === sub.id ? (
                            <input
                              type="text"
                              value={subcategoriaForm.nome}
                              onChange={e => setSubcategoriaForm({ ...subcategoriaForm, nome: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded-md w-full"
                            />
                          ) : (
                            sub.nome
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingSubcategoriaId === sub.id ? (
                            <input
                              type="text"
                              value={subcategoriaForm.descricao}
                              onChange={e => setSubcategoriaForm({ ...subcategoriaForm, descricao: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded-md w-full"
                            />
                          ) : (
                            sub.descricao
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  {editingSubcategoriaId === sub.id ? (
    <button
      className="inline-flex items-center p-1 text-green-600 hover:text-green-800 focus:outline-none"
      title="Salvar"
      onClick={() => handleSaveSubcategoria(sub.id)}
    >
      <Check size={18} />
    </button>
  ) : (
    <>
      <button
        className="inline-flex items-center p-1 text-blue-600 hover:text-blue-800 focus:outline-none"
        title="Editar"
        onClick={() => {
          setEditingSubcategoriaId(sub.id);
          setSubcategoriaForm({
            modalidade_id: sub.modalidade_id,
            nome: sub.nome,
            descricao: sub.descricao
          });
        }}
      >
        <Edit2 size={18} />
      </button>
      <button
        className="inline-flex items-center p-1 text-red-600 hover:text-red-800 focus:outline-none ml-2"
        title="Excluir"
        onClick={() => handleDeleteSubcategoria(sub.id)}
      >
        <Trash2 size={18} />
      </button>
    </>
  )}
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aba de Esportes */}
        {activeTab === 'esportes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Gerenciar Esportes</h2>
              <button
                onClick={() => setIsAddingEsporte(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Adicionar Esporte
              </button>
            </div>
            
            {/* Formulário para adicionar esporte */}
            {isAddingEsporte && (
              <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="text-md font-medium mb-3">Novo Esporte</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={esporteForm.nome}
                      onChange={(e) => setEsporteForm({ ...esporteForm, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={esporteForm.ativo}
                        onChange={(e) => setEsporteForm({ ...esporteForm, ativo: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Ativo</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    onClick={() => setIsAddingEsporte(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddEsporte}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
            
            {/* Tabela de esportes */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {esportes.map(esporte => (
                    <tr key={esporte.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingEsporteId === esporte.id ? (
                          <input
                            type="text"
                            value={esporteForm.nome}
                            onChange={(e) => setEsporteForm({ ...esporteForm, nome: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded-md w-full"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{esporte.nome}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingEsporteId === esporte.id ? (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={esporteForm.ativo}
                              onChange={(e) => setEsporteForm({ ...esporteForm, ativo: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-sm">Ativo</span>
                          </label>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            esporte.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {esporte.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  {editingEsporteId === esporte.id ? (
    <button
      className="inline-flex items-center p-1 text-green-600 hover:text-green-800 focus:outline-none"
      title="Salvar"
      onClick={() => handleSaveEsporte(esporte.id)}
    >
      <Check size={18} />
    </button>
  ) : (
    <>
      <button
        className="inline-flex items-center p-1 text-blue-600 hover:text-blue-800 focus:outline-none"
        title="Editar"
        onClick={() => {
          setEditingEsporteId(esporte.id);
          setEsporteForm({ nome: esporte.nome, ativo: esporte.ativo });
        }}
      >
        <Edit2 size={18} />
      </button>
      <button
        className="inline-flex items-center p-1 text-red-600 hover:text-red-800 focus:outline-none ml-2"
        title="Excluir"
        onClick={() => handleDeleteEsporte(esporte.id)}
      >
        <Trash2 size={18} />
      </button>
    </>
  )}
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Aba de Modalidades */}
        {activeTab === 'modalidades' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Gerenciar Modalidades</h2>
              <button
                onClick={() => setIsAddingModalidade(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Adicionar Modalidade
              </button>
            </div>
            {/* Formulário para adicionar modalidade */}
            {isAddingModalidade && (
              <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="text-md font-medium mb-3">Nova Modalidade</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Esporte</label>
                    <select
                      value={modalidadeForm.esporte_id}
                      onChange={e => setModalidadeForm({ ...modalidadeForm, esporte_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Selecione o esporte</option>
                      {esportes.map(e => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Modalidade</label>
                    <input
                      type="text"
                      value={modalidadeForm.nome}
                      onChange={e => setModalidadeForm({ ...modalidadeForm, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jogadores por Time</label>
                    <input
                      type="number"
                      value={modalidadeForm.jogadores_por_time}
                      onChange={e => setModalidadeForm({ ...modalidadeForm, jogadores_por_time: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min={0}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={modalidadeForm.ativo}
                        onChange={e => setModalidadeForm({ ...modalidadeForm, ativo: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Ativo</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    onClick={() => setIsAddingModalidade(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddModalidade}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
            {/* Tabela de modalidades */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Esporte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jogadores/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modalidades.map(modalidade => {
                    const esporte = esportes.find(e => e.id === modalidade.esporte_id);
                    return (
                      <tr key={modalidade.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{esporte ? esporte.nome : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingModalidadeId === modalidade.id ? (
                            <input
                              type="text"
                              value={modalidadeForm.nome}
                              onChange={e => setModalidadeForm({ ...modalidadeForm, nome: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded-md w-full"
                            />
                          ) : (
                            modalidade.nome
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingModalidadeId === modalidade.id ? (
                            <input
                              type="number"
                              value={modalidadeForm.jogadores_por_time}
                              onChange={e => setModalidadeForm({ ...modalidadeForm, jogadores_por_time: Number(e.target.value) })}
                              className="px-2 py-1 border border-gray-300 rounded-md w-full"
                              min={0}
                            />
                          ) : (
                            modalidade.jogadores_por_time
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingModalidadeId === modalidade.id ? (
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={modalidadeForm.ativo}
                                onChange={e => setModalidadeForm({ ...modalidadeForm, ativo: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm">Ativo</span>
                            </label>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${modalidade.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {modalidade.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  {editingModalidadeId === modalidade.id ? (
    <button
      className="inline-flex items-center p-1 text-green-600 hover:text-green-800 focus:outline-none"
      title="Salvar"
      onClick={() => handleSaveModalidade(modalidade.id)}
    >
      <Check size={18} />
    </button>
  ) : (
    <>
      <button
        className="inline-flex items-center p-1 text-blue-600 hover:text-blue-800 focus:outline-none"
        title="Editar"
        onClick={() => {
          setEditingModalidadeId(modalidade.id);
          setModalidadeForm({
            esporte_id: modalidade.esporte_id,
            nome: modalidade.nome,
            jogadores_por_time: modalidade.jogadores_por_time,
            ativo: modalidade.ativo
          });
        }}
      >
        <Edit2 size={18} />
      </button>
      <button
        className="inline-flex items-center p-1 text-red-600 hover:text-red-800 focus:outline-none ml-2"
        title="Excluir"
        onClick={() => handleDeleteModalidade(modalidade.id)}
      >
        <Trash2 size={18} />
      </button>
    </>
  )}
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
    {/* Confirmation Dialog for delete */}
    <ConfirmationDialog
      isOpen={deleteDialog.isOpen}
      title={
        deleteDialog.type === 'esporte' ? 'Excluir Esporte' :
        deleteDialog.type === 'modalidade' ? 'Excluir Modalidade' :
        deleteDialog.type === 'subcategoria' ? 'Excluir Subcategoria' : ''
      }
      message={
        deleteDialog.type === 'esporte' ? 'Tem certeza que deseja excluir este esporte?' :
        deleteDialog.type === 'modalidade' ? 'Tem certeza que deseja excluir esta modalidade?' :
        deleteDialog.type === 'subcategoria' ? 'Tem certeza que deseja excluir esta subcategoria?' : ''
      }
      confirmButtonText="Excluir"
      cancelButtonText="Cancelar"
      onConfirm={confirmDelete}
      onCancel={cancelDelete}
      confirmButtonColor="red"
    />
    </React.Fragment>
  );
};

export default AdminSportsManagement;