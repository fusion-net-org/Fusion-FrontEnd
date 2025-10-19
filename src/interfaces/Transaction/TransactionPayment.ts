export interface TransactionPaymentRequest{
    PackageId: string;
}

export interface TransactionPaymentResponse{
    id: string;
    transactionCode: string;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    subscriptionPackageName?: string;
    userId?: string;
}