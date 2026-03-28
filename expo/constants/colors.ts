export const Colors = {
  // New color palette with improved contrast
  primary: '#34748c',      // Darker blue for better contrast
  primaryLight: '#4f8497', // Medium blue
  primaryDark: '#2c6d85',  // Very dark blue
  secondary: '#f5e6f7',    // Very light purple background
  secondaryLight: '#acac74', // Sage green
  accent: '#4f8497',       // Medium blue for better contrast
  accentLight: '#9bdbbf',  // Mint green
  cream: '#fbfbfb',        // Off-white
  creamDark: '#f5ccc4',    // Soft peach
  gold: '#fbeb5c',         // Bright yellow
  goldLight: '#fbac94',    // Coral
  goldDark: '#8c9468',     // Darker olive for better contrast
  text: '#1a1a1a',         // Almost black for maximum contrast
  textLight: '#2d3748',    // Much darker gray for better readability (WCAG AA compliant)
  textOnGold: '#000000',   // Pure black text for gold backgrounds
  textOnDark: '#ffffff',   // White text for dark backgrounds
  textOnPrimary: '#ffffff', // White text on primary color
  background: '#fbfbfb',   // Off-white
  white: '#FFFFFF',
  success: '#2d6a4f',      // Darker green for better contrast
  warning: '#b8860b',      // Darker golden for better contrast
  error: '#c53030',        // Darker red for better contrast
  info: '#2c5282',         // Darker blue for better contrast
  border: '#c4d8e7',       // Light blue-gray
  shadow: 'rgba(44, 109, 133, 0.1)',
  overlay: 'rgba(44, 109, 133, 0.5)',
};

export const Gradients = {
  // Updated gradients with new palette
  primary: ['#4f8497', '#549ab4'] as const,
  secondary: ['#ac8cb3', '#acac74'] as const,
  accent: ['#6aaaca', '#9bdbbf'] as const,
  cream: ['#fbfbfb', '#f5ccc4'] as const,
  ocean: ['#4f8497', '#6aaaca'] as const,
  sage: ['#acac74', '#b3bb8c'] as const,
  coral: ['#fbac94', '#f5ccc4'] as const,
  mint: ['#9bdbbf', '#a7d9f7'] as const,
  // Airbnb-inspired clean gradients
  clean: ['#fbfbfb', '#c4d8e7'] as const,
  subtle: ['rgba(79, 132, 151, 0.05)', 'rgba(79, 132, 151, 0.02)'] as const,
  card: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)'] as const,
  // Tab-specific gradients
  servicesGradient: ['#4f8497', '#549ab4'] as const,
  foodGradient: ['#acac74', '#b3bb8c'] as const,
  messagesGradient: ['#ac8cb3', '#6aaaca'] as const,
  profileGradient: ['#34748c', '#4f8497'] as const,
  nearMeGradient: ['#6aaaca', '#9bdbbf'] as const,
  // Background gradients
  darkToLight: ['#2c6d85', '#4f8497', '#6aaaca', '#9bdbbf', '#c4d8e7', '#fbfbfb'] as const,
  galaxy: ['#2c6d85', '#34748c', '#4f8497'] as const,
  constellation: ['rgba(44, 109, 133, 0.8)', 'rgba(79, 132, 151, 0.4)', 'rgba(106, 170, 202, 0.2)'] as const,
  // Card effects
  purpleGreen: ['#ac8cb3', '#acac74'] as const,
  glow: ['rgba(255, 255, 255, 0.3)', 'transparent'] as const,
  floating: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] as const,
};