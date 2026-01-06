import { decodeToken } from './jwt';

describe('JWT Utility', () => {
  it('decodes a valid JWT token', () => {
    // A simple JWT token (header.payload.signature)
    // Payload: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
    const mockToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const decoded = decodeToken(mockToken);

    expect(decoded).toHaveProperty('sub', '1234567890');
    expect(decoded).toHaveProperty('name', 'John Doe');
    expect(decoded).toHaveProperty('iat', 1516239022);
  });

  it('decodes token with custom claims', () => {
    // Token with custom claims
    const customToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYmMxMjMiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3MDAwMDAwMDB9.invalid-signature';

    const decoded = decodeToken(customToken);

    expect(decoded).toHaveProperty('userId', 'abc123');
    expect(decoded).toHaveProperty('role', 'admin');
    expect(decoded).toHaveProperty('exp', 1700000000);
  });

  it('throws error for invalid token', () => {
    const invalidToken = 'not-a-valid-jwt';

    expect(() => {
      decodeToken(invalidToken);
    }).toThrow();
  });

  it('throws error for malformed token', () => {
    const malformedToken = 'invalid.token';

    expect(() => {
      decodeToken(malformedToken);
    }).toThrow();
  });

  it('decodes token with email claim', () => {
    const emailToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.invalid';

    const decoded = decodeToken(emailToken);

    expect(decoded).toHaveProperty('email', 'test@example.com');
  });
});
