export default function Offline() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: '2rem',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        textAlign: 'center',
      }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0369a1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: '1.5rem' }}
        aria-hidden="true"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <circle cx="12" cy="20" r="1" fill="#0369a1" stroke="none" />
      </svg>

      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '0.75rem',
        }}
      >
        Sin conexión
      </h1>

      <p
        style={{
          fontSize: '1rem',
          color: '#4b5563',
          marginBottom: '2rem',
          maxWidth: '320px',
          lineHeight: 1.6,
        }}
      >
        No hay conexión a Internet. Verificá tu red e intentá nuevamente.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: '#0369a1',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
