export interface PayOSCreateLinkResponse{
    checkoutUrl: string;
}

export interface PayOSConfirmWebhookResponse{
    success: boolean;
    message?: string;
}