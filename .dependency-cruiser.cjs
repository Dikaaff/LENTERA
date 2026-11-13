/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "reports-is-pure",
      comment: "reports holds schema and pure helpers; no Firebase, React, or DOM.",
      severity: "error",
      from: { path: "^src/modules/reports" },
      to: { path: "^(firebase|react|react-dom|react-router-dom)" },
    },
    {
      name: "only-inference-touches-ai",
      comment: "firebase/ai is only allowed inside src/modules/inference.",
      severity: "error",
      from: { pathNot: "^src/modules/inference" },
      to: { path: "^firebase/ai" },
    },
    {
      name: "only-queue-touches-firestore",
      comment: "Firestore access is confined to src/modules/queue.",
      severity: "error",
      from: { pathNot: "^src/modules/queue" },
      to: { path: "^firebase/firestore" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.app.json" },
    exclude: { path: "(^|/)(test|__tests__)(/|$)" },
  },
};
