// Applies a forced theme before first paint to avoid a flash of the wrong colours.
try {
  var t = localStorage.getItem('trimly:theme')
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t
} catch (e) {}
