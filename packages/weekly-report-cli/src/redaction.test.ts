import { redactSensitiveText } from './redaction.js';

it('redacts URL userinfo and common secret query values from diagnostics', () => {
  expect(
    redactSensitiveText(
      "fatal: unable to access 'https://account:example-value@example.invalid/repo.git?token=another-example&mode=read': denied",
    ),
  ).toBe("fatal: unable to access '[REDACTED_URL]': denied");
});

it('redacts a remote URL even when it contains no credential', () => {
  expect(
    redactSensitiveText(
      "fatal: unable to access 'https://example.invalid/repo.git': denied",
    ),
  ).toBe("fatal: unable to access '[REDACTED_URL]': denied");
});
