import { useState, useEffect } from 'react';
import { Search, UserPlus, X, User, Phone, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Inicialización del cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dni?: string;
}

export default function ClientSelectorModal({ isOpen, onClose, onSelectClient }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Estados para el Formulario de Nuevo Cliente
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newRole, setNewRole] = useState('customer');
  const [newStatus, setNewStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newImage, setNewImage] = useState('/perfilimage.png'); // Avatar inicial estético
  const [newAddress, setNewAddress] = useState('');

  // Efecto para cargar los usuarios reales de Supabase
  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error cargando clientes de Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('users')
        .insert([{ 
          name: newName, 
          email: newEmail,
          username: newUsername || null, // <-- ¡Listo para la BD!
          password: newPassword || null,
          dni: newDni || null,
          phone: newPhone || null,
          address: newAddress || null,
          role: newRole,
          status: newStatus,
          image: newImage || null
        }])
        .select()
        .single();

      if (error) throw error;

      setClients((prev) => [data, ...prev]);
      onSelectClient(data);
      
      // Limpiar y cerrar todo de manera segura
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setIsCreateOpen(false);
      onClose();
    } catch (err: any) {
        // Imprime de forma legible todo el objeto detallado que devuelve Supabase
        console.error('❌ Error completo de Supabase:', JSON.stringify(err, null, 2));
        console.error('📋 Mensaje específico:', err?.message || err);
        console.error('🔍 Detalles:', err?.details);
        console.error('💡 Pista (Hint):', err?.hint);
        
        alert(`Hubo un error al guardar el cliente: ${err?.message || 'Error desconocido'}`);
      } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Fondo oscuro del modal principal */}
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Contenedor del Modal Principal */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h3 className="font-black text-lg text-zinc-900">Seleccionar Cliente</h3>
            <p className="text-xs text-zinc-500 font-medium">Búsqueda directa en la base de datos</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="p-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center"
              title="Añadir nuevo cliente"
            >
              <UserPlus size={18} />
            </button>
            <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="p-5 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo electrónico..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="p-5 pt-2 overflow-y-auto flex-1 space-y-2 min-h-62.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
              <Loader2 className="animate-spin text-zinc-900" size={28} />
              <p className="text-xs font-bold">Sincronizando con Supabase...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            filteredClients.map(client => (
              <div 
                key={client.id} 
                onClick={() => { onSelectClient(client); onClose(); }}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50/70 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200 font-bold text-sm">
                    {client.name ? client.name.charAt(0).toUpperCase() : <User size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm group-hover:text-zinc-950">{client.name || 'Sin Nombre'}</p>
                    <p className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                      <Mail size={12} /> {client.email}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500 font-medium mb-4 text-sm">No se encontraron registros coincidentes.</p>
              <button 
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 mx-auto hover:bg-zinc-800 transition-all shadow-sm"
              >
                <UserPlus size={14} /> Registrar como nuevo cliente
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SUB-MODAL INTERNO: NOMBRE DE USUARIO Y CARGA DE AVATAR ULTRA-ESTÉTICO */}
        {/* ========================================================================= */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 animate-in fade-in duration-150">
            {/* Capa de fondo interno (Backdrop) */}
            <div 
              className="absolute inset-0 bg-zinc-950/50 backdrop-blur-md" 
              onClick={() => !submitting && setIsCreateOpen(false)} 
            />
            
            {/* Tarjeta del Formulario Flotante */}
            <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[90vh]">
              
              {/* Header del Submodal */}
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div>
                  <h4 className="font-black text-base text-zinc-900">Nuevo Cliente</h4>
                  <p className="text-xs text-zinc-500 font-medium">Configuración avanzada de perfil y credenciales</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)} 
                  disabled={submitting}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors p-1.5 bg-white border border-zinc-200 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Cuerpo del Formulario */}
              <form onSubmit={handleCreateClient} className="p-5 space-y-4 overflow-y-auto flex-1">
                
                {/* SECCIÓN PRO: Selector de Avatar / Imagen de Usuario */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center gap-4 group">
                  <div className="relative w-16 h-16 rounded-2xl bg-white border-2 border-zinc-200 overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-200">
                    {newImage ? (
                      <img 
                        src={newImage} 
                        alt="Avatar Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Si '/perfilimage.png' no existe o falla, carga este por defecto automáticamente
                          e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${newName || 'User'}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-black text-zinc-700 block">Imagen de Perfil</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const randomSeed = Math.random().toString(36).substring(7);
                          setNewImage(`https://api.dicebear.com/7.x/open-peeps/svg?seed=${randomSeed}`);
                        }}
                        className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-[11px] font-bold hover:border-zinc-900 hover:text-zinc-900 transition-all shadow-sm"
                      >
                        🎲 Aleatorio
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("Introduce la URL de la imagen de tu cliente:");
                          if (url) setNewImage(url);
                        }}
                        className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-[11px] font-bold hover:border-zinc-900 hover:text-zinc-900 transition-all shadow-sm"
                      >
                        🌐 Pegar URL
                      </button>
                      {newImage && (
                        <button
                          type="button"
                          onClick={() => setNewImage('')}
                          className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-100 transition-all"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fila: Identificación y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-700 block">Identificación / DNI</label>
                    <input 
                      type="text"
                      placeholder="Ej: 1-1234-5678"
                      value={newDni || ''}
                      onChange={(e) => setNewDni(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-700 block">Teléfono</label>
                    <input 
                      type="tel"
                      placeholder="Ej: 8888-8888"
                      value={newPhone || ''}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* NUEVO: Campo de Dirección */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-700 block">Dirección de Entrega</label>
                  <textarea 
                    rows={2}
                    placeholder="Ej: Provincia, Cantón, Distrito, Detalle exacto de la ubicación..."
                    value={newAddress || ''}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all resize-none"
                  />
                </div>

                {/* Fila: Correo y Contraseña */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-700 block">Correo Electrónico <span className="text-red-500">*</span></label>
                    <input 
                      type="email"
                      required
                      placeholder="juan@correo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-700 block">
                      Contraseña <span className="text-zinc-400 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword || ''}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-zinc-400 hover:text-zinc-700 transition-colors p-1"
                        title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fila: Identificación y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-700 block">Identificación / DNI</label>
                    <input 
                      type="text"
                      placeholder="Ej: 1-1234-5678"
                      value={newDni || ''}
                      onChange={(e) => setNewDni(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-700 block">Teléfono</label>
                    <input 
                      type="tel"
                      placeholder="Ej: 8888-8888"
                      value={newPhone || ''}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Fila: Rol y Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-700 block">Rol / Nivel del Usuario</label>
                    <select
                      value={newRole || 'customer'}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {/* ROLES OPERATIVOS */}
                      <optgroup label="Personal de la Tienda">
                        <option value="admin">Administrador (Acceso Total)</option>
                        <option value="seller">Vendedor / Gestor</option>
                      </optgroup>

                      {/* NIVELES DE CLIENTES (Clásicos Metálicos) */}
                      <optgroup label="Niveles de Cliente Normal">
                        <option value="customer">Cliente Estándar</option>
                        <option value="bronze">Cliente Bronce</option>
                        <option value="silver">Cliente Plata</option>
                        <option value="gold">Cliente Oro</option>
                      </optgroup>

                      {/* NIVELES PREMIUM O VIP (Opciones extra) */}
                      <optgroup label="Niveles VIP o Especiales">
                        <option value="platinum">Cliente Platino</option>
                        <option value="black">Cliente Black / VIP</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-700 block">Estado Inicial</label>
                    <select
                      value={newStatus || 'active'}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-4 border-t border-zinc-100 flex justify-end gap-2 bg-white sticky bottom-0">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Guardando...
                      </>
                    ) : (
                      'Guardar Cliente'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}