const COMPANY_KEY = 'ctx.company_id';

export const setCurrentCompanyId = (companyId?: string) => {
  if (companyId && companyId.trim()) sessionStorage.setItem(COMPANY_KEY, companyId);
  else sessionStorage.removeItem(COMPANY_KEY);
};

export const getCurrentCompanyId = (): string =>
  sessionStorage.getItem(COMPANY_KEY) || '';

export const clearCurrentCompanyId = () => {
  sessionStorage.removeItem(COMPANY_KEY);
};
