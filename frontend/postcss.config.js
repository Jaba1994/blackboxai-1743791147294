module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-import': {},
    'postcss-nesting': {},
    'postcss-custom-properties': {
      preserve: false,
      importFrom: [
        {
          customProperties: {
            '--color-primary': '#0ea5e9',
            '--color-secondary': '#64748b',
            '--color-success': '#22c55e',
            '--color-danger': '#ef4444',
            '--color-warning': '#f59e0b',
            '--color-info': '#3b82f6'
          }
        }
      ]
    }
  }
};