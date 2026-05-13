// Re-export pour compatibilité — la vraie implémentation vit dans src/domain/auth/actions.ts.
// Note: ce fichier ne réexporte QUE des Server Actions (async functions).
// Les constantes comme idleAuthState doivent être importées depuis @/domain/auth/schema.
export { loginAction, signupAction, logoutAction } from "@/domain/auth/actions";
