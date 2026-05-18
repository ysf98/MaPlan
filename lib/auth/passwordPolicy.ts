export const PASSWORD_REQUIREMENTS: string[] = [
  "Minimo 9 caracteres",
  "Al menos una letra mayuscula",
  "Al menos una letra minuscula",
  "Al menos un numero",
  "Recomendado: al menos un simbolo (por ejemplo: !@#$%)"
];

const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /\d/;
const SYMBOL_REGEX = /[^A-Za-z0-9]/;

export function getPasswordRequirementChecks(password: string): {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
} {
  return {
    minLength: password.length >= 9,
    hasUppercase: UPPERCASE_REGEX.test(password),
    hasLowercase: LOWERCASE_REGEX.test(password),
    hasNumber: NUMBER_REGEX.test(password),
    hasSymbol: SYMBOL_REGEX.test(password)
  };
}

export function validatePassword(password: string): string | null {
  const checks = getPasswordRequirementChecks(password);

  if (!checks.minLength) {
    return "La contrasena debe tener al menos 9 caracteres.";
  }
  if (!checks.hasUppercase) {
    return "La contrasena debe incluir al menos una letra mayuscula.";
  }
  if (!checks.hasLowercase) {
    return "La contrasena debe incluir al menos una letra minuscula.";
  }
  if (!checks.hasNumber) {
    return "La contrasena debe incluir al menos un numero.";
  }

  return null;
}
