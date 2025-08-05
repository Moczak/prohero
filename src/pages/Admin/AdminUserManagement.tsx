import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminUserManagement.module.css';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import ConfirmationDialog from '../../components/UI/ConfirmationDialog';

interface User {
  auth_user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'fa', label: 'Fã' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'atleta', label: 'Atleta' }
];

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('users')
        .select('auth_user_id, email, name, avatar_url, role, created_at');
      if (error) {
        setError('Erro ao carregar usuários.');
        setLoading(false);
        return;
      }
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    if (search) {
      filtered = filtered.filter(u => (u.name || '').toLowerCase().includes(search.toLowerCase()));
    }
    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(filtered);
  }, [users, search, roleFilter]);

  const handleEdit = (user: User) => {
    setEditUserId(user.auth_user_id);
    setEditRole(user.role);
  };

  const handleEditSave = async (user: User) => {
    setEditLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ role: editRole })
      .eq('auth_user_id', user.auth_user_id);
    setEditLoading(false);
    if (error) {
      setError('Erro ao atualizar função.');
      return;
    }
    setUsers(users => users.map(u => u.auth_user_id === user.auth_user_id ? { ...u, role: editRole } : u));
    setEditUserId(null);
  };

  const handleDelete = (user: User) => {
    setConfirmDeleteUser(user);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteUser) return;
    setDeleteLoadingId(confirmDeleteUser.auth_user_id);
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('auth_user_id', confirmDeleteUser.auth_user_id);
    setDeleteLoadingId(null);
    setConfirmDeleteUser(null);
    if (error) {
      setError('Erro ao excluir usuário.');
      return;
    }
    setUsers(users => users.filter(u => u.auth_user_id !== confirmDeleteUser.auth_user_id));
  };

  const cancelDelete = () => setConfirmDeleteUser(null);

  return (
    <>
      {confirmDeleteUser && (
        <ConfirmationDialog
          isOpen={!!confirmDeleteUser}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir o usuário ${confirmDeleteUser.email}?`}
          confirmButtonText="Excluir"
          cancelButtonText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmButtonColor="red"
        />
      )}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 items-center">
          <input
            className={"flex-1 min-w-[220px] px-4 py-2 border border-gray-200 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-100 " + styles['admin-users-search']}
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className={"min-w-[140px] px-4 py-2 border border-gray-200 rounded-md text-base " + styles['admin-users-filter']}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        <select
          className={"min-w-[140px] px-4 py-2 border border-gray-200 rounded-md text-base " + styles['admin-users-filter']}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          {ROLE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Carregando usuários...</p>
      ) : error ? (
        <p className="text-red-600 text-sm mb-2">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={"min-w-full " + styles['admin-users-table']}>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Função</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.auth_user_id}>
                  <td>
                    {user.avatar_url ? (
                      <div className="relative">
                        <img 
                          src={user.avatar_url.includes('googleusercontent.com') ? user.avatar_url.split('=')[0] : user.avatar_url} 
                          alt={user.name || user.email} 
                          className={styles['admin-users-avatar']} 
                          onError={(e) => {
                            // Fallback para a letra inicial se a imagem não carregar
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const fallbackElement = target.parentElement?.querySelector('span');
                            if (fallbackElement) {
                              (fallbackElement as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <span className={styles['admin-users-avatar']} style={{display: 'none'}}>
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <span className={styles['admin-users-avatar']}>
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td>{user.name || '-'}</td>
                  <td>{user.email}</td>
                  <td>
                    {editUserId === user.auth_user_id ? (
                      <select
                        className={styles['admin-users-role-select']}
                        value={editRole}
                        onChange={e => setEditRole(e.target.value)}
                        disabled={editLoading}
                      >
                        <option value="admin">Admin</option>
                        <option value="fa">Fã</option>
                        <option value="tecnico">Técnico</option>
                        <option value="atleta">Atleta</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                    {editUserId === user.auth_user_id ? (
                      <>
                        <button className="edit" onClick={() => handleEditSave(user)} disabled={editLoading} title="Salvar">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditUserId(null)} disabled={editLoading} title="Cancelar">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="edit" onClick={() => handleEdit(user)} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button className="delete" onClick={() => handleDelete(user)} disabled={deleteLoadingId === user.auth_user_id} title="Excluir">
                          {deleteLoadingId === user.auth_user_id ? <span style={{fontSize:12}}>...</span> : <Trash2 size={18} />} 
                        </button>
                      </>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminUserManagement;
