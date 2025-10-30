export type FundConfig = {
  id: string;
  name: string;
};

const FUND_DEFINITIONS: FundConfig[] = [];

export function getFundById(id: string) {
  return FUND_DEFINITIONS.find((fund) => fund.id === id);
}

export function listFunds() {
  return [...FUND_DEFINITIONS];
}
