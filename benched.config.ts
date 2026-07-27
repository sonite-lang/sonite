export default {
  samples: 20,
  warmup: 3,
  timeout: 120_000,
  export: {
    formats: ["json"],
    includeEnvironment: true,
    includeSamples: false,
    outputDir: "scripts/benchmarks",
  },
  ui: {
    liveUpdates: true,
  },
};
