const URL = /\b[a-z][a-z0-9+.-]*:\/\/[^\s'"<>]+/giu;
const SECRET_QUERY_VALUE =
  /([?&](?:access_token|api_key|key|password|secret|token)=)[^&#\s'" ]+/giu;

export function redactSensitiveText(value: string): string {
  return value
    .replace(URL, '[REDACTED_URL]')
    .replace(SECRET_QUERY_VALUE, '$1[REDACTED]');
}
