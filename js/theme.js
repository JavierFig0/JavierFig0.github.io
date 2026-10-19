// Aplica el modo guardado (o el del sistema) antes de pintar la página para evitar parpadeos.
// Se carga en el <head> sin defer/async para que corra antes de mostrar el contenido.
// La clase "js" activa las animaciones de scroll solo si JavaScript está disponible.
(function () {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.classList.toggle('dark', dark);
  root.classList.add('js');
})();
