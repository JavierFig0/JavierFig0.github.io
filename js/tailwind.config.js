// Configuración de Tailwind (CDN). Los colores salen de variables CSS (css/styles.css),
// así cada tema solo redefine las variables. Debe cargarse justo después del script de Tailwind.
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        pixel: ['VT323', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg:       'rgb(var(--bg) / <alpha-value>)',
        surface:  'rgb(var(--surface) / <alpha-value>)',
        line:     'rgb(var(--line) / <alpha-value>)',
        fg:       'rgb(var(--fg) / <alpha-value>)',
        muted:    'rgb(var(--muted) / <alpha-value>)',
        accent:   'rgb(var(--accent) / <alpha-value>)',
        onaccent: 'rgb(var(--on-accent) / <alpha-value>)',
      },
    },
  },
};
