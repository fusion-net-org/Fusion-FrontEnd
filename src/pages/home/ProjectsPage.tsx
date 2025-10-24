import React from 'react';
import ProjectsGrid from '@/components/Company/Projects/ProjectsGrid';
import type { Project } from '@/interfaces/Project/project';

const data: Project[] = [
  { id:'1', code:'PRJ - 123', name:'Projects Name', status:'To do',
    hireLabel:'Hired by Company name', convertedFrom:'PRQ-324',
    description:'Lorem ipsum dolor sit amet consectetur. Ut in urna amet ut consectetur faucibus odio.',
    progress:{done:0,total:65}, overdueTasks:0,
    startDate:'09-10-2025', endDate:'30-10-25', lastUpdatedAgo:'5h ago',
    owner:{name:'Nguyen Duy'}, membersCount:9, sprintLabel:'#Sprint 3' },
  { id:'2', code:'PRJ - 123', name:'Projects Name', status:'Done',
    hireLabel:'Hired by Company name', convertedFrom:'PRQ-324',
    description:'Lorem ipsum dolor sit amet consectetur. Ut in urna amet ut consectetur faucibus odio.',
    progress:{done:50,total:50},
    startDate:'09-10-2025', endDate:'30-10-25', lastUpdatedAgo:'5h ago',
    owner:{name:'Nguyen Duy'}, membersCount:9, sprintLabel:'#Sprint 3' },
  { id:'3', code:'PRJ - 123', name:'Projects Name', status:'In review',
    hireLabel:'Hired by Company name', convertedFrom:'PRQ-324',
    description:'Lorem ipsum dolor sit amet consectetur. Ut in urna amet ut consectetur faucibus odio.',
    progress:{done:15,total:50}, overdueTasks:2,
    startDate:'09-10-2025', endDate:'30-10-25', lastUpdatedAgo:'5h ago',
    owner:{name:'Nguyen Duy'}, membersCount:9, sprintLabel:'#Sprint 3' },
  { id:'4', code:'PRJ - 123', name:'Projects Name', status:'In progress',
    hireLabel:'Internal', convertedFrom:'PRQ-324',
    description:'Lorem ipsum dolor sit amet consectetur. Ut in urna amet ut consectetur faucibus odio.',
    progress:{done:80,total:120}, overdueTasks:2,
    startDate:'09-10-2025', endDate:'30-10-25', lastUpdatedAgo:'5h ago',
    owner:{name:'Nguyen Duy'}, membersCount:9, sprintLabel:'#Sprint 3' },
  { id:'5', code:'PRJ - 123', name:'Projects Name', status:'In review',
    hireLabel:'Hired by Company name', convertedFrom:'PRQ-324',
    description:'Lorem ipsum dolor sit amet consectetur. Ut in urna amet ut consectetur faucibus odio.',
    progress:{done:31,total:50},
    startDate:'09-10-2025', endDate:'30-10-25', lastUpdatedAgo:'5h ago',
    owner:{name:'Nguyen Duy'}, membersCount:9, sprintLabel:'#Sprint 3' },
  { id:'6', code:'PRJ - 123', name:'Projects Name', status:'Done',
    hireLabel:'Hired by Company name', convertedFrom:'PRQ-324',
    description:'Lorem ipsum dolor sit amet consectetur. Ut in urna amet ut consectetur faucibus odio.',
    progress:{done:50,total:50},
    startDate:'09-10-2025', endDate:'30-10-25', lastUpdatedAgo:'5h ago',
    owner:{name:'Nguyen Duy'}, membersCount:9, sprintLabel:'#Sprint 3' },
];

export default function ProjectsPage(){
  return <ProjectsGrid items={data} title="Projects" />;
}
