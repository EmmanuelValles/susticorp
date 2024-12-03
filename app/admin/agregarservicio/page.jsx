'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/firebase/config'; // Importa la configuración de Firebase
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { auth } from '@/app/firebase/config';

function AgregarServicio() {
  const router = useRouter();
  const serviciosCollection = collection(db, "servicios");
  const [user, setUser] = useState(null);
  // Estados locales para los valores del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [rangoPrecios, setRangoPrecios] = useState('');
  const [imagenes, setImagenes] = useState([]); // Archivos seleccionados
  const [previews, setPreviews] = useState([]); // URLs para las miniaturas
  const [subiendo, setSubiendo] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Menú de la sidebar

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Guardar al usuario autenticado
      } else {
        router.push('/admin/sign-in'); // Redirigir al login si no hay usuario
      }
    });

    return () => unsubscribe(); // Limpiar el listener cuando se desmonta el componente
  }, [router]);

  if (!user) {
    return <p>Cargando...</p>; // Mostrar algo mientras se verifica la autenticación
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/admin/sign-in'); // Redirigir al login después de cerrar sesión
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImagenes((prev) => [...prev, ...files]);

    // Generar vistas previas para las imágenes seleccionadas
    const filePreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...filePreviews]);
  };

  const eliminarImagen = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const subirImagenesACloudinary = async () => {
    const enlaces = [];

    for (let imagen of imagenes) {
      const formData = new FormData();
      formData.append("file", imagen);
      formData.append("upload_preset", "susticorpcloudinary"); // Reemplaza con tu Upload Preset
      formData.append("folder", `servicios/${nombre}`); // Carpeta en Cloudinary

      const response = await fetch("https://api.cloudinary.com/v1_1/dqigc5zir/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error al subir la imagen: ${imagen.name}`);
      }

      const data = await response.json();
      enlaces.push(data.secure_url); // Agregar la URL segura
    }

    return enlaces;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubiendo(true);

    try {
      // Subir imágenes a Cloudinary y obtener sus URLs
      const enlacesImagenes = await subirImagenesACloudinary();

      // Crear un documento en la colección "servicios"
      const servicioRef = await addDoc(serviciosCollection, {
        nombre,
        descripcion,
        rangoPrecios,
        creadoEn: new Date(),
      });

      // Crear una subcolección para las imágenes
      const imagenesCollection = collection(servicioRef, "imagenes");
      for (let url of enlacesImagenes) {
        await setDoc(doc(imagenesCollection), { url });
      }

      console.log("Servicio agregado correctamente");
      router.push('/admin/dashboard'); // Redirecciona a la página principal o a donde prefieras
    } catch (error) {
      console.error("Error al agregar el servicio: ", error);
    } finally {
      setSubiendo(false);
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
            <button onClick={() => handleSignOut()} className="flex items-center space-x-2 hover:text-teal-400">
              <span>Cerrar sesión</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <header className="flex items-center justify-between mb-8 lg:hidden">
          <h1 className="text-2xl font-bold">Agregar Servicio</h1>
          <button onClick={() => setIsMenuOpen(true)} className="text-gray-800">
            <span className="material-icons">menu</span>
          </button>
        </header>

        {/* Botones Volver y Agregar Cita */}
        <div className="flex justify-between mb-4">
          <button
            className="bg-teal-800 text-white px-4 py-2 rounded"
            onClick={() => router.push('/admin/dashboard')}
          >
            Volver
          </button>
        </div>

        {/* Formulario para agregar servicio */}
        <div className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8 mt-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg text-black font-semibold">Información:</h2>
            </div>

            <div className="flex flex-col space-y-4">
              <label className="text-gray-600 font-semibold">
                Nombre:
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ingrese el nombre del servicio"
                  className="border rounded-lg w-full p-2 mt-1"
                  required
                />
              </label>

              <label className="text-gray-600 font-semibold">
                Descripción:
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describa el servicio"
                  className="border rounded-lg w-full p-2 mt-1"
                  rows="4"
                  required
                />
              </label>

              <label className="text-gray-600 font-semibold">
                Rango de precios:
                <input
                  type="text"
                  value={rangoPrecios}
                  onChange={(e) => setRangoPrecios(e.target.value)}
                  placeholder="Ingrese el rango de precios"
                  className="border rounded-lg w-full p-2 mt-1"
                  required
                />
              </label>

              <label className="text-gray-600 font-semibold">
                Imágenes:
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="border rounded-lg w-full p-2 mt-1"
                  accept="image/*"
                />
              </label>

              {/* Vista previa de las imágenes */}
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                      <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => eliminarImagen(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className={`w-full ${subiendo ? 'bg-gray-400' : 'bg-teal-900'} text-white py-2 rounded-lg font-bold mt-6`}
              disabled={subiendo}
            >
              {subiendo ? 'Subiendo...' : 'Agregar servicio'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AgregarServicio;
