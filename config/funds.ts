export type FundConfig = {
  id: string;
  name: string;
};

export const FUNDS: FundConfig[] = [
  { id: "zakat", name: "Zakat" },
  { id: "sadaqah", name: "Sadaqah" },
  { id: "relief", name: "Emergency Relief" },
];

export function getFundById(id: string) {
  return FUNDS.find((fund) => fund.id === id);
}

export function listFunds() {
  return [...FUNDS];
}
