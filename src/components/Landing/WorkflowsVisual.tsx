import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Square, 
  ArrowRight, 
  Plus, 
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle,
  Workflow,
  GitBranch
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  name: string;
  type: 'start' | 'process' | 'end';
  position: { x: number; y: number };
  isActive: boolean;
}

interface Connection {
  from: string;
  to: string;
  isActive: boolean;
}

const WorkflowBuilder = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: '1', name: 'Start', type: 'start', position: { x: 50, y: 150 }, isActive: false },
    { id: '2', name: 'Review', type: 'process', position: { x: 200, y: 100 }, isActive: false },
    { id: '3', name: 'Approve', type: 'process', position: { x: 350, y: 50 }, isActive: false },
    { id: '4', name: 'Reject', type: 'process', position: { x: 350, y: 150 }, isActive: false },
    { id: '5', name: 'Complete', type: 'end', position: { x: 500, y: 100 }, isActive: false }
  ]);

  const [connections] = useState<Connection[]>([
    { from: '1', to: '2', isActive: false },
    { from: '2', to: '3', isActive: false },
    { from: '2', to: '4', isActive: false },
    { from: '3', to: '5', isActive: false }
  ]);

  const [activeStep, setActiveStep] = useState(0);
  const steps = ['1', '2', '3', '5'];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setNodes(prevNodes => 
      prevNodes.map(node => ({
        ...node,
        isActive: steps.slice(0, activeStep + 1).includes(node.id)
      }))
    );
  }, [activeStep]);

  const getNodeIcon = (type: string, isActive: boolean) => {
    switch (type) {
      case 'start':
        return <Play size={16} className={isActive ? 'text-green-600' : 'text-gray-400'} />;
      case 'end':
        return <Square size={16} className={isActive ? 'text-red-600' : 'text-gray-400'} />;
      default:
        return <Settings size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Workflow Builder</h3>
        <button className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
          <Plus size={14} />
          Add Node
        </button>
      </div>

      <div className="relative h-64 bg-gray-50 rounded-lg overflow-hidden">
        <svg className="absolute inset-0 w-full h-full">
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const isActive = fromNode.isActive && toNode.isActive;

            return (
              <line
                key={index}
                x1={fromNode.position.x + 40}
                y1={fromNode.position.y + 20}
                x2={toNode.position.x}
                y2={toNode.position.y + 20}
                stroke={isActive ? '#3B82F6' : '#D1D5DB'}
                strokeWidth={isActive ? 3 : 2}
                strokeDasharray={isActive ? '0' : '4,4'}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
              node.isActive ? 'scale-110' : 'scale-100'
            }`}
            style={{ left: node.position.x, top: node.position.y }}
          >
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-300 ${
              node.isActive 
                ? 'bg-white border-blue-500 shadow-lg' 
                : 'bg-gray-100 border-gray-300'
            }`}>
              {getNodeIcon(node.type, node.isActive)}
              <span className={`text-sm font-medium ${
                node.isActive ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {node.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        One engine for <span className="font-medium text-blue-600">Projects</span>, 
        <span className="font-medium text-green-600"> Tasks</span>, 
        <span className="font-medium text-purple-600"> Tickets</span>, and 
        <span className="font-medium text-orange-600"> Project Requests</span>
      </div>
    </div>
  );
};

const ProjectRequestFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showToast, setShowToast] = useState('');

  const steps = [
    { name: 'Create PRQ', status: 'draft', color: 'gray' },
    { name: 'Submit', status: 'submitted', color: 'blue' },
    { name: 'Review', status: 'under_review', color: 'yellow' },
    { name: 'Approve', status: 'approved', color: 'green' },
    { name: 'Convert to Project', status: 'converted', color: 'purple' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = (prev + 1) % steps.length;
        
        // Show toasts at specific steps
        if (next === 1) setShowToast('project_request.submitted');
        else if (next === 3) setShowToast('project_request.approved');
        else if (next === 4) setShowToast('project.created');
        else setShowToast('');
        
        return next;
      });
    }, 2500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Project Request → Project Flow</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                index <= currentStep 
                  ? `bg-${step.color}-100 border-${step.color}-500 text-${step.color}-700` 
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                <span className="text-sm font-bold">{index + 1}</span>
              </div>
              <div className="mt-2 text-xs text-center">
                <div className="font-medium">{step.name}</div>
                <div className="text-gray-500">{step.status}</div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight 
                  size={16} 
                  className={`absolute mt-6 ml-12 transition-colors duration-300 ${
                    index < currentStep ? 'text-green-500' : 'text-gray-300'
                  }`} 
                />
              )}
            </div>
          ))}
        </div>

        {showToast && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Event: {showToast}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Auto-linked:</strong> PRQ-123 → PROJECT-456
            <br />
            <strong>Copied:</strong> Code, Name, Dates
            <br />
            <strong>Workflow:</strong> Applied default project workflow
          </div>
        </div>
      </div>
    </div>
  );
};

const CrossCompanyConnections = () => {
  const [connectionStatus, setConnectionStatus] = useState(0);
  const statuses = [
    { name: 'Send Request', color: 'blue', description: 'Company A → Company B' },
    { name: 'Pending', color: 'yellow', description: 'Awaiting approval' },
    { name: 'Accepted', color: 'green', description: 'Partnership active' },
    { name: 'Abilities Unlocked', color: 'purple', description: 'Send PRQ, invite members' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(prev => (prev + 1) % statuses.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentStatus = statuses[connectionStatus];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Workflow size={20} className="text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Cross-Company Partnerships</h3>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl font-bold text-blue-600">A</span>
            </div>
            <div className="text-sm font-medium">TechCorp</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
              connectionStatus >= 2 ? 'bg-green-100 text-green-600' : 
              connectionStatus >= 1 ? 'bg-yellow-100 text-yellow-600' : 
              'bg-blue-100 text-blue-600'
            }`}>
              {connectionStatus >= 2 ? <CheckCircle size={16} /> : 
               connectionStatus >= 1 ? <Clock size={16} /> : 
               <ArrowRight size={16} />}
            </div>
            <div className="text-xs text-center mt-2">
              <div className="font-medium">{currentStatus.name}</div>
              <div className="text-gray-500">{currentStatus.description}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl font-bold text-green-600">B</span>
            </div>
            <div className="text-sm font-medium">StartupXYZ</div>
          </div>
        </div>
      </div>

      {connectionStatus >= 3 && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-900 font-medium mb-2">Partnership Benefits:</div>
          <div className="space-y-1 text-sm text-purple-700">
            <div>✓ Send project requests across companies</div>
            <div>✓ Invite partner members to projects</div>
            <div>✓ Shared notifications and updates</div>
          </div>
        </div>
      )}
    </div>
  );
};

const WorkflowsVisual = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="workflows" ref={sectionRef} className="py-24 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Intelligent <span className="text-blue-600">workflow automation</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From project requests to cross-company partnerships, FUSION orchestrates complex business processes with elegant simplicity.
          </p>
        </div>

        <div className="space-y-12">
          <div className={`transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <WorkflowBuilder />
          </div>

          <div className={`grid md:grid-cols-2 gap-8 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <ProjectRequestFlow />
            <CrossCompanyConnections />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowsVisual;