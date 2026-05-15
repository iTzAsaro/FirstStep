export type SessionRole = "talento" | "empresa";

export type SessionState = {
  isAuthenticated: boolean;
  role: SessionRole | null;
  userName: string | null;
  companyName: string | null;
  onboardingCompleted: boolean;
};

export type SessionApi = SessionState & {
  loginTalent: (payload: { email: string }) => void;
  loginCompany: (payload: { companyName: string; email: string }) => void;
  completeOnboarding: () => void;
  logout: () => void;
};
