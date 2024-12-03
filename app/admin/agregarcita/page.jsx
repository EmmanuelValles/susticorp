'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/app/firebase/config'; // Importa la configuración de Firebase
import { collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';

function AgregarCita() {
  const [servicios, setServicios] = useState([]); // Lista de servicios disponibles
  const [formData, setFormData] = useState({
    clienteNombre: '',
    fecha: '', // Campo de fecha
    hora: '',
    servicio: '', // ID del servicio
    telefono: '',
    correo: '',
    direccion: '',
  });
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/admin/sign-in');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Cargar servicios desde Firestore
  useEffect(() => {
    const fetchServicios = async () => {
      const serviciosRef = collection(db, 'servicios');
      const serviciosSnapshot = await getDocs(serviciosRef);
      const serviciosList = serviciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setServicios(serviciosList);
    };

    fetchServicios();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Agregar cita a Firestore
  const agregarCita = async () => {
    const { clienteNombre, fecha, hora, servicio, telefono, correo, direccion } = formData;

    if (!clienteNombre || !fecha || !hora || !servicio || !telefono || !correo || !direccion) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      // Primero, obtener el nombre del servicio a partir de su ID
      const servicioRef = doc(db, 'servicios', servicio);
      const servicioSnapshot = await getDoc(servicioRef); // Usamos getDoc()

      if (!servicioSnapshot.exists()) {
        alert('Servicio no encontrado.');
        return;
      }

      const nombreServicio = servicioSnapshot.data().nombre;

      // Luego, guardar la cita con el nombre del servicio
      const citasCollectionRef = collection(servicioRef, 'citas'); // Subcolección "citas"

      await addDoc(citasCollectionRef, {
        clienteNombre,
        fecha,
        hora,
        servicio: nombreServicio, // Guardamos el nombre del servicio
        estado: 'Pendiente', // Se guarda automáticamente como "Pendiente"
        telefono,
        correo,
        direccion,
      });

      alert('Cita agregada correctamente.');
      router.push('/admin/citas'); // Redirigir a la página de citas
    } catch (error) {
      console.error('Error al agregar la cita:', error);
      alert('Ocurrió un error al agregar la cita.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-0 z-20 bg-teal-900 text-white p-6 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64`}>
        <div className="flex items-center justify-between mb-8 lg:hidden">
          <h1 className="text-lg font-bold">Susticorp</h1>
          <button onClick={() => setIsMenuOpen(false)} className="text-white">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="flex flex-col items-center mb-10">
          <img src="https://res.cloudinary.com/dqigc5zir/image/upload/v1733178017/nplcp7t5yc0czt7pctwc.png" alt="Susticorp Logo" className="w-16 h-16 mb-4" />
          <h1 className="text-lg font-semibold">Susticorp</h1>
        </div>
        <ul className="space-y-4">
          {[{ label: 'Citas', path: '/admin/citas' }, { label: 'Cotizaciones', path: '/admin/cotizaciones' }, { label: 'Añadir servicio', path: '/admin/agregarservicio' }, { label: 'Modificar servicio', path: '/admin/modificarservicio' }].map(({ label, path }) => (
            <li key={path}>
              <button onClick={() => router.push(path)} className="flex items-center space-x-2 hover:text-teal-400">
                <span>{label}</span>
              </button>
            </li>
          ))}
          <li>
            <button onClick={() => router.push('/admin/sign-in')} className="flex items-center space-x-2 hover:text-teal-400">
              <span>Cerrar sesión</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 lg:hidden">
          <h1 className="text-2xl font-bold text-black">Agregar cita</h1>
          <button onClick={() => setIsMenuOpen(true)} className="text-gray-800">
            <span className="material-icons">menu</span>
          </button>
        </header>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-600 text-lg mb-4">Información de la cita:</h2>

          <div className="grid grid-cols-1 gap-4">
            {/* Nombre del cliente */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Nombre del cliente:</label>
              <input
                type="text"
                name="clienteNombre"
                value={formData.clienteNombre}
                onChange={handleChange}
                className="w-full text-gray-600 p-2 border rounded"
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Fecha:</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="w-full p-2 text-gray-600 border rounded"
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Hora:</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className="w-full p-2 text-gray-600 border rounded"
              />
            </div>

            {/* Servicio */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Servicio:</label>
              <select
                name="servicio"
                value={formData.servicio}
                onChange={handleChange}
                className="w-full p-2 text-gray-600 border rounded"
              >
                <option value="">Selecciona</option>
                {servicios.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Teléfono:</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full p-2 border text-gray-600 rounded"
              />
            </div>

            {/* Correo */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Correo:</label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="w-full p-2 text-gray-600 border rounded"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Dirección:</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full p-2 text-gray-600 border rounded"
              />
            </div>
          </div>

          {/* Botón para agregar cita */}
          <div className="mt-6">
            <button
              className="bg-teal-800 text-white px-4 py-2 rounded w-full"
              onClick={agregarCita}
            >
              Agregar cita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgregarCita;
