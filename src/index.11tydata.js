// The landing page belongs only to the multi-creator deployment.
export default {
  eleventyComputed: {
    permalink: () =>
      process.env.INDIENODES_BUILD_CREATOR === "*" ? "index.html" : false,
  },
};
