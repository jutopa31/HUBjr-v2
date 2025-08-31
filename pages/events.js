import { useState, useEffect } from 'react';

export default function EventsPage() {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('General');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events?category=${filter}`);
      const data = await res.json();
      
      if (res.ok) {
        setEvents(data.events);
        setCategories(data.categories);
      } else {
        setError(data.message || 'Error fetching events');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, link, category })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTitle('');
        setLink('');
        setCategory('General');
        fetchEvents();
      } else {
        setError(data.message || 'Error creating event');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchEvents(); 
  }, [filter]);

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ 
          color: '#1f2937', 
          fontSize: '2.5rem',
          marginBottom: '0.5rem'
        }}>
          🧠 Simple Event Manager
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Sistema simple de gestión de eventos académicos y clínicos
        </p>
      </header>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <section style={{ 
        background: '#f9fafb',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        marginBottom: '2rem',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ 
          color: '#374151',
          marginBottom: '1rem',
          fontSize: '1.25rem'
        }}>
          📝 Crear Nuevo Evento
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
              Título del Evento *
            </label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Ej: Sesión NIHSS, Rounds Matutinos, Conferencia..."
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
              Link/URL *
            </label>
            <input 
              value={link} 
              onChange={e => setLink(e.target.value)} 
              placeholder="https://..."
              type="url"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
              Categoría
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            >
              <option value="General">General</option>
              <option value="Clinical">Clínico</option>
              <option value="Education">Educación</option>
              <option value="Research">Investigación</option>
              <option value="Administrative">Administrativo</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar Evento'}
          </button>
        </form>
      </section>

      <section>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ 
            color: '#374151',
            fontSize: '1.25rem',
            margin: 0
          }}>
            📋 Eventos Guardados ({events.length})
          </h2>
          
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            ⏳ Cargando eventos...
          </div>
        ) : events.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            color: '#6b7280'
          }}>
            📭 No hay eventos guardados todavía
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {events.map((event, i) => (
              <li key={event.id || i} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '0.75rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 0.5rem 0',
                      color: '#1f2937',
                      fontSize: '1.1rem'
                    }}>
                      <strong>{event.title}</strong>
                    </h3>
                    <p style={{ 
                      margin: '0 0 0.5rem 0',
                      color: '#6b7280'
                    }}>
                      🔗 <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        {event.link}
                      </a>
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <span>📂 {event.category}</span>
                      <span>📅 {new Date(event.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      
      <footer style={{ 
        marginTop: '2rem',
        padding: '1rem',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.875rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p>🏥 Hospital Nacional Posadas - Servicio de Neurología</p>
        <p>Desarrollado con Next.js + Vercel Serverless Functions</p>
      </footer>
    </div>
  );
}