// postcss.config.cjs
module.exports = {
  plugins: {
    "postcss-pxtorem": {
      rootValue: 16, // The base font size (e.g., 16px for 1rem)
      unitPrecision: 5, // The decimal numbers to allow the REM units to grow to
      propList: ["font-size", "--*"], // The properties that can change from px to rem (use '*' for all)
      selectorBlackList: [], // Selectors to ignore and leave as px
      replace: true, // Replace px with rem
      mediaQuery: false, // Allow rem to be converted in media queries
      minPixelValue: 0, // Set the minimum pixel value to replace
    },
    "postcss-nesting": {}, // Enable nesting support
    "@csstools/postcss-global-data": {
      // Import global CSS files to use in css modules
      files: ["src/assets/queries.css"],
    },
    "postcss-custom-media": {}, // Enable custom media queries
  },
};
