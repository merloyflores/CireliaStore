'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, Settings2, Trash2, Check, Tag } from 'lucide-react';
import { createPortal } from 'react-dom';

// DICCIONARIO INTELIGENTE: Mapeamos cada característica con su placeholder ideal
const SPEC_EXAMPLES: Record<string, string> = {
  "Acabado": "ej: Mate, Brillante, Cepillado, Texturizado...",
  "Almacenamiento": "ej: 512GB NVMe M.2 SSD, 1TB HDD...",
  "Alimentación": "ej: Cable AC, Batería Recargable, USB-C...",
  "Altavoces": "ej: Estéreo integrados, 2x 5W, Dolby Atmos...",
  "Amperaje": "ej: 2.4A, 5A, 16A...",
  "Ancho de Banda": "ej: 48 Gbps (HDMI 2.1), 10 Gbps...",
  "Ángulo de Visión": "ej: 178° Horizontal / Vertical...",
  "Apertura": "ej: f/1.8, f/2.4, f/4.0...",
  "Aplicación Compatible": "ej: SmartThings, Tuya Smart, Apple Home...",
  "Autonomía": "ej: Hasta 24 horas de reproducción...",
  "Batería": "ej: 4500 mAh, Polímero de Litio...",
  "Bluetooth": "ej: v5.3, LE Audio, No soporta...",
  "Brillo": "ej: 400 nits, 1200 nits (pico HDR)...",
  "Cable": "ej: Trenzado de 1.8 metros, Extraíble...",
  "Canales de Audio": "ej: 2.1 Canales, 5.1 Surround, 7.1...",
  "Capacidad": "ej: 256GB, 1.5 Litros, 12 Cubiertos, 18 kg...",
  "Carga Rápida": "ej: Sí, 65W SuperVOOC, PD 3.0...",
  "Carga Inalámbrica": "ej: Sí, 15W Qi Standard, No...",
  "Certificación": "ej: IP68 (Sumergible), CE, ENERGY STAR...",
  "Chipset / Procesador": "ej: Apple M3, Snapdragon 8 Gen 3, Intel i7...",
  "Color": "ej: Negro Obsidiana, Plata Titanio, Azul Medianoche...",
  "Compatibilidad": "ej: iOS, Android, PS5, Xbox, Windows...",
  "Conectividad": "ej: USB-C, Jack 3.5mm, HDMI 2.1, DisplayPort...",
  "Conexiones Simultáneas": "ej: Hasta 2 dispositivos (Multipoint)...",
  "Consumo": "ej: 15W (En uso), 0.5W (Standby)...",
  "Controles": "ej: Panel Táctil, Botones Físicos, Control Remoto...",
  "Contraste": "ej: 1,000,000:1 (Dinámico), 1000:1 (Estático)...",
  "Dimensiones": "ej: 15.4 x 7.2 x 0.8 cm...",
  "Diseño": "ej: Ergonómico, Ultra delgado, Curvo 1500R...",
  "Distancia de Funcionamiento": "ej: Hasta 10 metros en línea recta...",
  "Duración": "ej: Hasta 12 horas por carga, Vida útil 50,000h...",
  "Efectos de Iluminación": "ej: RGB Direccionable, Estático, Modos Dinámicos...",
  "Eficiencia Energética": "ej: Clase A+++, Certificación 80 Plus Gold...",
  "Entradas": "ej: 3x HDMI, 2x USB, 1x Óptico Digital...",
  "Frecuencia": "ej: 60Hz, 2.4GHz / 5GHz (Dual Band)...",
  "Funciones Smart": "ej: Comando de voz, Emparejamiento rápido, AI...",
  "Fuente de Alimentación": "ej: 110V-220V Auto-voltaje, Externa 12V...",
  "Garantía": "ej: 1 año con fabricante, 6 meses local...",
  "Grosor": "ej: 7.9 mm, 12 mm...",
  "Iluminación": "ej: Retroiluminación LED, RGB Cronos...",
  "Impedancia": "ej: 32 Ohms, 16 Ohms...",
  "Interfaz": "ej: PCIe Gen 4, SATA III, USB 3.2...",
  "Lente": "ej: Gran angular, Teleobjetivo de 50mm...",
  "Longitud del Cable": "ej: 1.2 metros, 2 metros...",
  "Lúmenes": "ej: 3500 ANSI Lúmenes (Proyectores)...",
  "Marca": "ej: Samsung, Sony, Apple, Nintendo...",
  "Material": "ej: Aluminio aeroespacial, Cristal Gorilla Glass...",
  "Memoria RAM": "ej: 8GB LPDDR5, 16GB DDR5...",
  "Micrófono": "ej: Integrado con cancelación de ruido, No...",
  "Modelo": "ej: SM-G998B, PlayStation 5 Slim...",
  "Modos de Uso": "ej: Eco, Turbo, Automático, Manual...",
  "Montaje": "ej: VESA 100x100 mm, Soporte de mesa...",
  "Nivel de Ruido": "ej: 24 dB (Silencioso), 45 dB...",
  "Panel": "ej: IPS, VA, OLED, AMOLED, TN...",
  "Peso": "ej: 189g, 1.4 kg (Liviano)...",
  "Plataforma": "ej: Nintendo Switch, PC, Cross-platform...",
  "Potencia": "ej: 65W, 1200W RMS, 500 Peak...",
  "Rango de Operación": "ej: 0°C a 50°C, Humedad 10% a 80%...",
  "Relación de Aspecto": "ej: 16:9 (Widescreen), 21:9 (Ultrawide)...",
  "Resolución": "ej: 4K UHD (3840x2160), Full HD 1080p...",
  "Resolución de Cámara": "ej: 50 MP (Principal) + 12 MP (Ultra Wide)...",
  "Resistencia": "ej: Contra impactos, Rayaduras, Agua IPX7...",
  "Respuesta (Tiempo)": "ej: 1 ms (GtG), 4 ms...",
  "Salidas de Audio": "ej: Óptica, RCA, Auxiliar 3.5mm...",
  "Sensor": "ej: Biométrico dactilar, Giroscopio, Óptico Hero...",
  "Seguridad": "ej: Cifrado AES de 128 bits, Bloqueo infantil...",
  "Sistema de Enfriamiento": "ej: Ventilador dinámico, Refrigeración líquida...",
  "Sistema Operativo": "ej: Android 14, iOS 17, Windows 11, Tizen...",
  "Software Incluido": "ej: Licencia de prueba 1 mes, App de gestión...",
  "Tamaño": "ej: 6.7 pulgadas, 55 pulgadas, 14 pulgadas...",
  "Tasa de Refresco": "ej: 120Hz, 144Hz, 240Hz...",
  "Tecnología": "ej: Inverter, Quantum Dot, ANC (Canc. Activa)...",
  "Temperatura": "ej: Rango ajustable de 4°C a 18°C...",
  "Tipo": "ej: Audífonos In-Ear, Smart TV, Freidora de Aire...",
  "Tipo de Conector": "ej: Tipo C, Lightning, Micro USB...",
  "Velocidad": "ej: Hasta 3500 MB/s de lectura, 100 km/h...",
  "Velocidades / Niveles": "ej: 3 niveles de potencia, 6 velocidades...",
  "Voltaje": "ej: 110V, 220V, Bi-voltaje (100-240V)...",
  "Wi-Fi": "ej: Sí (Wi-Fi 6E Dual Band), No disponible...",
  "Zoom": "ej: 3x Óptico, 30x Digital..."
};

// Obtenemos las llaves ordenadas alfabéticamente para el select
const COMMON_SPECS = Object.keys(SPEC_EXAMPLES).sort();

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  return createPortal(children, document.body);
};

export default function SpecManagerModal({ productId, currentSpecs, onClose, onSave }: any) {
  const [specs, setSpecs] = useState(currentSpecs || {});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addSpec = () => {
    // Evita añadir características vacías o duplicar llaves en blanco
    if (newKey.trim() && newValue.trim()) {
      setSpecs({ ...specs, [newKey.trim()]: newValue.trim() });
      setNewKey("");
      setNewValue("");
    }
  };

  const removeSpec = (key: string) => {
    const updated = { ...specs };
    delete updated[key];
    setSpecs(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('products').update({ specifications: specs }).eq('id', productId);
    if (!error) onSave();
    setIsSaving(false);
  };

  // Lógica para obtener el placeholder dinámico
  // Si newKey existe en nuestro diccionario, usamos su ejemplo. Si no (es custom), usamos uno genérico.
  const dynamicPlaceholder = SPEC_EXAMPLES[newKey] || "Valor (ej: 2500 mAh, Sí, 15cm...)";

  return (
    // CONTENEDOR PRINCIPAL: Paddin p-4 para que no pegue a los bordes en móvil
    <ModalPortal>
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-6">
        
        {/* Backdrop con blur */}
        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* LA SOLUCIÓN UNIVERSAL PARA MÓVILES:
            1. max-h-[90dvh]: Máximo 90% del alto de la pantalla (dvh respeta teclados móviles)
            2. flex flex-col: Permite flexbox vertical
            3. overflow-hidden: Evita que el contenido se desborde del diseño redondeado
        */}
        <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-100 flex flex-col max-h-[90dvh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* HEADER: shrink-0 evita que se encoja cuando hay mucho contenido */}
            <div className="shrink-0 px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/80 rounded-t-3xl">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                <Settings2 size={18} />
                </div>
                <h2 className="text-sm font-black text-zinc-950 uppercase tracking-widest">Características</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-400">
                <X size={18} />
            </button>
            </div>

            {/* BODY: flex-1 ocupa el espacio sobrante, overflow-y-auto crea el scroll interno */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            
            {/* Formulario de entrada (Movido arriba para mejor UX en móvil) */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3 mb-8">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Añadir nueva</p>
                
                <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <select 
                    className="w-full text-sm p-3 pl-9 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all appearance-none bg-white cursor-pointer"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    >
                    <option value="">Seleccionar del catálogo...</option>
                    {COMMON_SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                
                <input 
                    placeholder="O escribe un atributo personalizado..."
                    className="w-full text-sm p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                />
                
                <input 
                    placeholder={dynamicPlaceholder}
                    className="w-full text-sm p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addSpec();
                    }
                    }}
                />
                </div>

                <button 
                onClick={addSpec} 
                disabled={!newKey || !newValue}
                className="w-full bg-zinc-950 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 transition-all active:scale-[0.98]"
                >
                <Plus size={16} /> Añadir a la lista
                </button>
            </div>

            {/* Lista actual */}
            <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Atributos asignados</p>
                
                {Object.keys(specs).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
                    <p className="text-zinc-400 text-sm font-medium">No hay características añadidas.</p>
                </div>
                )}
                
                {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="group flex justify-between items-center p-3 bg-white border border-zinc-100 rounded-xl hover:border-zinc-200 transition-all shadow-sm">
                    <div className="flex flex-col pr-4">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{key}</span>
                    <span className="text-sm font-semibold text-zinc-900 break-words">{value as string}</span>
                    </div>
                    <button 
                    onClick={() => removeSpec(key)} 
                    className="p-2 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                    title="Eliminar atributo"
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
                ))}
            </div>

            </div>

            {/* FOOTER: shrink-0 asegura que el botón de guardado siempre esté visible al fondo */}
            <div className="shrink-0 px-6 py-4 border-t border-zinc-100 bg-zinc-50/80 rounded-b-3xl">
            <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full bg-sky-600 text-white p-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-[0.98] disabled:opacity-70"
            >
                {isSaving ? "Guardando cambios..." : <><Check size={18} /> Guardar características</>}
            </button>
            </div>
        </div>
        </div>
    </ModalPortal>
  );
}