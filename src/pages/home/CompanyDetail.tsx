import { useParams } from 'react-router-dom';

const CompanyDetails = () => {
  const { companyId } = useParams<{ companyId: string }>();
  console.log('Current companyId:', companyId);

  return <div>Đây là trang Detail của company {companyId}</div>;
};

export default CompanyDetails;
