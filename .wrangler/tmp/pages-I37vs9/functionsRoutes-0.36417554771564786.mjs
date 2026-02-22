import { onRequestOptions as __api_analyze_js_onRequestOptions } from "C:\\Users\\hdj\\clawd\\work\\projects\\decisible-landing\\functions\\api\\analyze.js"
import { onRequestPost as __api_analyze_js_onRequestPost } from "C:\\Users\\hdj\\clawd\\work\\projects\\decisible-landing\\functions\\api\\analyze.js"

export const routes = [
    {
      routePath: "/api/analyze",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_analyze_js_onRequestOptions],
    },
  {
      routePath: "/api/analyze",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_analyze_js_onRequestPost],
    },
  ]