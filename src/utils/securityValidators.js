/**
 * Utilitários de Validação e Sanitização de Segurança
 * Padrão OWASP para aplicações Discord Bot / Dashboard
 */

// Regex para IDs no padrão Discord Snowflake (17 a 20 dígitos numéricos)
const SNOWFLAKE_REGEX = /^\d{17,20}$/;

// Lista branca estrita de tipos de logs permitidos no sistema
const ALLOWED_LOG_TYPES = Object.freeze([
  "message_delete",
  "message_update",
  "voice_update",
  "member_join",
  "member_leave",
  "member_ban",
  "economy_log",
  "channel_update",
  "role_update",
  "server_update",
  "invite_update",
  "audit",
  "welcome",
  "leave",
  "messages",
  "voice",
  "roles",
  "channels",
  "moderation",
  "joins",
  "leaves",
]);

/**
 * Valida se uma string é um Discord Snowflake válido (17 a 20 dígitos)
 * @param {any} id
 * @returns {boolean}
 */
function isValidSnowflake(id) {
  if (typeof id !== "string" && typeof id !== "number") return false;
  return SNOWFLAKE_REGEX.test(String(id).trim());
}

/**
 * Valida parâmetro de canal: aceita "0" (desvinculado) ou Snowflake válido
 * @param {any} id
 * @returns {boolean}
 */
function isValidChannelParam(id) {
  if (typeof id !== "string" && typeof id !== "number") return false;
  const str = String(id).trim();
  return str === "0" || SNOWFLAKE_REGEX.test(str);
}

/**
 * Valida se um tipo de log faz parte da whitelist estrita
 * Previne poluição de protótipo (__proto__, constructor) e injeção arbitrária
 * @param {any} type
 * @returns {boolean}
 */
function isValidLogType(type) {
  if (typeof type !== "string") return false;
  const clean = type.toLowerCase().trim();
  // Bloqueio explícito de propriedades perigosas do JavaScript
  if (clean === "__proto__" || clean === "constructor" || clean === "prototype") {
    return false;
  }
  return ALLOWED_LOG_TYPES.includes(clean);
}

/**
 * Sanitiza e valida valores inteiros para o sistema de economia
 * Rejeita valores negativos, decimais, notação científica e fora do intervalo
 * @param {any} val - Valor vindo do formulário
 * @param {number} min - Mínimo permitido (default 0)
 * @param {number} max - Máximo permitido (default 1.000.000.000)
 * @returns {number|null} Retorna o número sanitizado ou null se inválido/rejeitado
 */
function sanitizeEconomyValue(val, min = 0, max = 1000000000) {
  if (val === undefined || val === null || val === "") return null;
  const str = String(val).trim();
  if (!/^\d+$/.test(str)) return null; // Aceita apenas dígitos numéricos inteiros não-negativos
  const parsed = parseInt(str, 10);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

/**
 * Sanitiza strings gerais removendo caracteres de controle e limitando comprimento
 * @param {any} str
 * @param {number} maxLen
 * @returns {string}
 */
function sanitizeString(str, maxLen = 100) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

module.exports = {
  isValidSnowflake,
  isValidChannelParam,
  isValidLogType,
  sanitizeEconomyValue,
  sanitizeString,
  ALLOWED_LOG_TYPES,
};
