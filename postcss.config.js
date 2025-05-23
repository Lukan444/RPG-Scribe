module.exports = {
  plugins: {
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
    'postcss-preset-env': {
      stage: 3,
      features: {
        // 'custom-properties': false, // Mantine v8 handles its CSS variables.
                                     // This can often be true or removed.
                                     // Let's keep it commented or remove if issues arise.
        'nesting-rules': true,
      },
    },
  },
};
