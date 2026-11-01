import worker from "../../../worker/src/index.js";

export const onRequest = (context) => worker.fetch(context.request, context.env);
