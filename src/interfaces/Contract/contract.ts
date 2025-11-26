export interface ContractAppendix {
  id: string;
  appendixName: string;
  appendixCode: string;
  appendixDescription: string;
}

export interface ContractResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: ContractData | null;
}

export interface ContractData {
  id: string;
  projectRequestId: string;
  contractCode: string;
  contractName: string;
  budget: number;
  status: string;
  effectiveDate: string;
  expiredDate: string;
  appendices: ContractAppendix[];
  attachment?: string;
}
