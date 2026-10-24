import app from "../routemate-person-b/src/server";

export default function handler(req: any, res: any) {
  return app(req, res);
}

// @ts-ignore
module.exports = app;
// @ts-ignore
module.exports.default = app;
