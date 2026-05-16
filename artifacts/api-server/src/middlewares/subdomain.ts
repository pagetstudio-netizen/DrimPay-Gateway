import type { Request, Response, NextFunction } from "express";

const MAIN_DOMAIN = process.env["MAIN_DOMAIN"] ?? "drimpay.com";

const SUBDOMAIN_MAP: Record<string, string> = {
  secure:    "/fr/security",
  docs:      "/fr/docs",
  developer: "/fr/docs",
  support:   "/fr/support",
  help:      "/fr/support",
  status:    "/fr/status",
  dashboard: "/dashboard",
  admin:     "/admin",
};

const API_SUBDOMAINS = new Set(["api", "sandbox", "www", "cdn"]);

export function subdomainMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const hostname = req.hostname;

  if (hostname === MAIN_DOMAIN || !hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    return next();
  }

  const subdomain = hostname.slice(0, -(MAIN_DOMAIN.length + 1));

  if (!subdomain || API_SUBDOMAINS.has(subdomain)) {
    return next();
  }

  if (req.path.startsWith("/api")) {
    return next();
  }

  const basePath = SUBDOMAIN_MAP[subdomain];
  if (!basePath) return next();

  const subPath = req.path === "/" ? "" : req.path;
  const target = `https://${MAIN_DOMAIN}${basePath}${subPath}`;

  res.redirect(301, target);
}
