import { Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/redux/store';
import { useEffect, useState } from 'react';
import { getProjectByCompanyId } from '@/services/projectService.js';

interface Company {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name?: string;
  companyId?: string;
}

const ProjectProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { companyId, projectId } = useParams();
  const user = useSelector((state: RootState) => state.user.user);

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (user === null) return;

    if (!companyId || !projectId) {
      setAuthorized(false);
      return;
    }

    const companyAccess = user.companies?.some((c: Company) => String(c.id) === String(companyId));

    if (!companyAccess) {
      setAuthorized(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const res = await getProjectByCompanyId(companyId);
        const projects: Project[] = res.data?.data?.items || [];

        console.log('PROJECT LIST:', projects);

        const projectAccess = projects.some((p) => String(p.id) === String(projectId));

        setAuthorized(projectAccess);
      } catch (err) {
        console.error(err);
        setAuthorized(false);
      }
    };

    fetchProjects();
  }, [companyId, projectId, user]);

  if (!user) return <Navigate to="/login" replace />;

  if (authorized === null) return <div>Checking permission...</div>;

  if (!authorized) return <Navigate to="/403" replace />;

  return <>{children}</>;
};

export default ProjectProtectedRoute;
