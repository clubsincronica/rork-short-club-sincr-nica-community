export const Colors = {
  // microCósmos palette — temporada Verano 26/27
  primary: '#16293a',       // Cielo amanecer profundo
  primaryLight: '#2a4c60', // Cielo medio
  primaryDark: '#357188',  // Acento principal (logo)
  secondary: '#8f8b80',    // Tierra suave
  secondaryLight: '#99eef5', // Arcilla / clay
  accent: '#fdae93',        // Tierra / coral
  accentLight: '#f4c542',  // Luz maíz
  clay: '#99eef5',          // Arcilla (logo)
  deep: '#1d3e4b',          // Deep - noche informativa
  earth: '#fdae93',         // Earth - tono cálido
  clayPastel: '#afc6fe',    // Lila pastel (logo)
  violet: '#af8fb4',        // Violeta pastel (logo)
  gold: '#f4c542',          // Gold - mismo que accentLight
  goldLight: '#f8df8e',     // Gold claro (degradados)
  goldDark: '#c9a227',      // Gold profundo (bordes)
  textOnGold: '#16293a',    // Tinta sobre gold/pasteles
  surfaceLight: 'rgba(255, 255, 255, 0.14)', // Superficie clara translúcida
  text: '#c9ced8',          // Texto claro (fondo #14161b)
  textLight: '#dfe5ee',    // Texto ligero
  textOnPrimary: '#ffffff', // Texto sobre primary (blanco)
  background: '#0f1a24',    // Fondo temporada
  white: '#FFFFFF',
  success: '#27756b',       // Verde oscuro para success
  warning: '#d4a853',       // Ámbar warning
  error: '#b32611',         // Rojo error
  info: '#357188',          // Info = primaryDark
  border: '#5d7d88',        // Border color
  shadow: 'rgba(22, 41, 58, 0.15)',
  overlay: 'rgba(22, 41, 58, 0.4)',
};

export const Gradients = {
  // microCósmos gradients — temporada Verano 26/27
  primary: ['#16293a', '#2a4c60'] as const,       // Cielo amanecer
  secondary: ['#8f8b80', '#99eef5'] as const,    // Tierra + clay
  accent: ['#357188', '#fdae93'] as const,        // Acento coral
  cream: ['#99eef5', '#fdae93'] as const,         // Clay gradient
  ocean: ['#16293a', '#357188'] as const,         // Deep to accent
  sage: ['#69b0d1', '#afc6fe'] as const,           // Mint-cielito
  coral: ['#fdae93', '#f4c542'] as const,          // Coral gradient
  mint: ['#99eef5', '#afc6fe'] as const,           // Mint pastel
  // Card effects
  purpleGreen: ['#af8fb4', '#99eef5'] as const,    // Violeta + clay
  glow: ['rgba(255, 255, 255, 0.3)', 'transparent'] as const,
  floating: ['rgba(153, 238, 245, 0.95)', 'rgba(253, 174, 147, 0.85)'] as const,
  // Background gradients
  darkToLight: ['#0f1a24', '#16293a', '#2a4c60', '#357188', '#5d7d88', '#8f8b80', '#99eef5', '#fdae93'] as const,
  galaxy: ['#16293a', '#357188', '#5d7d88'] as const,
  constellation: ['rgba(22, 41, 58, 0.8)', 'rgba(29, 62, 75, 0.4)', 'rgba(53, 113, 136, 0.2)'] as const,
};