/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",
  routes: (defineRoutes) =>
    defineRoutes((route) => {
      if (process.env.INCLUDE_TEST_ROUTES) {
        if (process.env.NODE_ENV === "production") {
          console.warn(
            "Warning: NODE_ENV is set to production so we will skip creating test routes"
          );
          return;
        }
        route("__tests/login", "__test-routes__/login.tsx");
        route("__tests/delete-user", "__test-routes__/delete-user.tsx");
      }
    }),
};
