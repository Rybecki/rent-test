export const APP_NAME = 'Rentally'
export const COMPANY_LEGAL_NAME = 'Rentally z siedzibą w Poznaniu'
export const COMPANY_ADDRESS = 'Poznań'
export const COMPANY_ADDRESS_LINE = COMPANY_LEGAL_NAME

/** Tryb testowy — dane w localStorage, bez API i bazy MySQL. */
export const USE_LOCAL_STORAGE = true

/** Tymczasowo: pomiń logowanie i wejdź od razu do aplikacji. */
export const SKIP_AUTH = true

export const DEV_AUTH_USER = {
  email: 'kontakt@rentally.pl',
  role: 'admin' as const,
}
