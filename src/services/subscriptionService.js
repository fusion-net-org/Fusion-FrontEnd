import { axiosInstance } from '../apiConfig';

export const getAllSubscriptions = async () =>{
    try{
        const response = await axiosInstance.get('/SubscriptionPackage/GetSubscriptionForCustomer');
        return response.data;
    }catch(error){
        throw new Error(error.response?.data?.message || 'Error!');
    }
}

 