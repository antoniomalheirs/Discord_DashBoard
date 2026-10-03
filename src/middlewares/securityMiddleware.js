const rateLimit = require("express-rate-limit");

/**
 * Middleware de Segurança Anti-CSRF e Validação de Origem
 * Protege rotas sensíveis de mutação de estado contra Cross-Site Request Forgery
 */
const isJsonRequest = (req) => Boolean(
  req.xhr ||
  req.query?.format === "json" ||
  req.headers["accept"]?.includes("application/json") ||
  req.headers["x-requested-with"] === "XMLHttpRequest"
);

const validateSameOriginOrFetchSite = (req, res, next) => {
  const currentHost = req.get("host");
  const isJson = isJsonRequest(req);

  // 1. Verificação Primária: Metadados RFC Sec-Fetch-Site (Chrome, Firefox, Safari, Edge)
  const secFetchSite = req.headers["sec-fetch-site"];
  if (secFetchSite) {
    if (secFetchSite !== "same-origin" && secFetchSite !== "same-site") {
      console.warn(`[SECURITY ALERT] Tentativa de CSRF bloqueada (Sec-Fetch-Site: ${secFetchSite}): IP ${req.ip} em ${req.originalUrl}`);
      if (isJson) return res.status(403).json({ success: false, message: "Acesso bloqueado por política de segurança: requisição cross-site não autorizada." });
      return res.status(403).render("error.ejs", {
        error: "Acesso bloqueado por política de segurança: requisição cross-site não autorizada.",
      });
    }
    return next(); // Proveniente de mesma origem/site
  }

  // 2. Verificação Secundária: Origin Header
  const origin = req.headers["origin"];
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== currentHost) {
        console.warn(`[SECURITY ALERT] Tentativa de CSRF bloqueada (Origin mismatch): ${originUrl.host} !== ${currentHost}`);
        if (isJson) return res.status(403).json({ success: false, message: "Acesso bloqueado por política de segurança: origem não reconhecida." });
        return res.status(403).render("error.ejs", {
          error: "Acesso bloqueado por política de segurança: origem não reconhecida.",
        });
      }
      return next(); // Origin validado
    } catch (e) {
      if (isJson) return res.status(400).json({ success: false, message: "Cabeçalho de origem malformado." });
      return res.status(400).render("error.ejs", { error: "Cabeçalho de origem malformado." });
    }
  }

  // 3. Verificação Terciária: Referer Header
  const referer = req.headers["referer"];
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== currentHost) {
        console.warn(`[SECURITY ALERT] Tentativa de CSRF bloqueada (Referer mismatch): ${refererUrl.host} !== ${currentHost}`);
        if (isJson) return res.status(403).json({ success: false, message: "Acesso bloqueado por política de segurança: referência externa não permitida." });
        return res.status(403).render("error.ejs", {
          error: "Acesso bloqueado por política de segurança: referência externa não permitida.",
        });
      }
      return next(); // Referer validado
    } catch (e) {
      if (isJson) return res.status(400).json({ success: false, message: "Cabeçalho de referência malformado." });
      return res.status(400).render("error.ejs", { error: "Cabeçalho de referência malformado." });
    }
  }

  // 4. Verificação AJAX (X-Requested-With enviado pelo jQuery / fetch interno)
  const isAjax = req.xhr || req.headers["x-requested-with"] === "XMLHttpRequest";
  if (isAjax) {
    return next();
  }

  // 5. POLÍTICA DE FALHA FECHADA (FAIL-CLOSED): Requisição de mutação sem qualquer comprovação de mesma origem
  console.warn(`[SECURITY ALERT] Bloqueio preventivo: Ação de mutação sem comprovação de mesma origem de IP ${req.ip} em ${req.originalUrl}`);
  if (isJson) return res.status(403).json({ success: false, message: "Acesso bloqueado: requisição sem comprovação de mesma origem válida." });
  return res.status(403).render("error.ejs", {
    error: "Acesso bloqueado: requisição sem comprovação de mesma origem válida.",
  });
};

/**
 * Rate Limiter Global: Protege a aplicação contra flood e DDoS de nível de aplicação
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas requisições deste IP, por favor tente novamente mais tarde.",
  skip: (req) => {
    // Isenta arquivos estáticos da contagem
    return /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/i.test(req.path);
  },
});

/**
 * Rate Limiter para Autenticação: Protege endpoints de login OAuth contra abuso
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Limite de tentativas de autenticação excedido. Tente novamente em 15 minutos.",
});

/**
 * Rate Limiter para Operações Críticas do Bot (Mutações de canal, banco e economia)
 */
const actionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas operações de configuração solicitadas. Aguarde alguns instantes antes de tentar novamente.",
});

module.exports = {
  validateSameOriginOrFetchSite,
  globalLimiter,
  authLimiter,
  actionLimiter,
};

