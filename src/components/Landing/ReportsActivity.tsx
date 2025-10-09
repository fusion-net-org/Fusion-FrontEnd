import React, { useEffect, useState, useRef } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock,
  Activity,
  Target,
  Zap,
  Calendar
} from 'lucide-react';

const VelocityChart = () => {
  const [currentSprint, setCurrentSprint] = useState(0);
  const sprints = [
    { name: 'Sprint 20', points: 45, completed: 42 },
    { name: 'Sprint 21', points: 38, completed: 40 },
    { name: 'Sprint 22', points: 52, completed: 48 },
    { name: 'Sprint 23', points: 44, completed: 44 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSprint(prev => (prev + 1) % sprints.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={20} className="text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Team Velocity</h3>
      </div>
      
      <div className="space-y-4">
        {sprints.map((sprint, index) => (
          <div key={sprint.name} className={`transition-all duration-500 ${
            index === currentSprint ? 'transform scale-105' : ''
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${
                index === currentSprint ? 'text-green-700' : 'text-gray-600'
              }`}>
                {sprint.name}
              </span>
              <span className="text-xs text-gray-500">
                {sprint.completed}/{sprint.points} pts
              </span>
            </div>
            <div className="relative">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="flex h-full">
                  <div 
                    className="bg-green-500 transition-all duration-1000"
                    style={{ width: `${(sprint.completed / sprint.points) * 100}%` }}
                  />
                  {sprint.points > sprint.completed && (
                    <div 
                      className="bg-gray-300 transition-all duration-1000"
                      style={{ width: `${((sprint.points - sprint.completed) / sprint.points) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              {index === currentSprint && (
                <div className="absolute -top-6 right-0 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium animate-bounce">
                  {Math.round((sprint.completed / sprint.points) * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-green-50 rounded-lg">
        <div className="text-sm text-green-800">
          <strong>Avg Velocity:</strong> 43.5 points/sprint
        </div>
      </div>
    </div>
  );
};

const WorkloadChart = () => {
  const [selectedMember, setSelectedMember] = useState(0);
  const members = [
    { name: 'Sarah Chen', tasks: 8, hours: 32, utilization: 90 },
    { name: 'Mike Johnson', tasks: 6, hours: 28, utilization: 78 },
    { name: 'Emily Davis', tasks: 10, hours: 36, utilization: 95 },
    { name: 'Alex Kumar', tasks: 5, hours: 24, utilization: 67 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedMember(prev => (prev + 1) % members.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Users size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Workload Distribution</h3>
      </div>
      
      <div className="space-y-3">
        {members.map((member, index) => (
          <div 
            key={member.name}
            className={`p-3 rounded-lg border transition-all duration-500 ${
              index === selectedMember 
                ? 'bg-blue-50 border-blue-300 transform scale-105' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`font-medium ${
                index === selectedMember ? 'text-blue-900' : 'text-gray-700'
              }`}>
                {member.name}
              </span>
              <div className="flex gap-2 text-xs">
                <span className="bg-white px-2 py-1 rounded">
                  {member.tasks} tasks
                </span>
                <span className="bg-white px-2 py-1 rounded">
                  {member.hours}h
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    member.utilization > 90 ? 'bg-red-500' :
                    member.utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${member.utilization}%` }}
                />
              </div>
              {index === selectedMember && (
                <span className="absolute -top-6 right-0 text-xs font-medium text-blue-700 animate-pulse">
                  {member.utilization}% utilized
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SLATracker = () => {
  const [currentMetric, setCurrentMetric] = useState(0);
  const metrics = [
    { name: 'First Response', target: '2h', actual: '1.8h', status: 'good' },
    { name: 'Resolution Time', target: '24h', actual: '18.5h', status: 'good' },
    { name: 'Customer Rating', target: '4.5★', actual: '4.7★', status: 'excellent' },
    { name: 'Escalation Rate', target: '<5%', actual: '2.3%', status: 'excellent' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetric(prev => (prev + 1) % metrics.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={20} className="text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">SLA Performance</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <div 
            key={metric.name}
            className={`p-3 rounded-lg border transition-all duration-500 ${
              index === currentMetric 
                ? 'bg-orange-50 border-orange-300 transform scale-105' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="text-xs text-gray-600 mb-1">{metric.name}</div>
            <div className={`text-sm font-bold ${
              index === currentMetric ? 'text-orange-900' : 'text-gray-700'
            }`}>
              {metric.actual}
            </div>
            <div className="text-xs text-gray-500">
              Target: {metric.target}
            </div>
            <div className={`text-xs mt-1 ${
              metric.status === 'excellent' ? 'text-green-600' : 'text-blue-600'
            }`}>
              {metric.status === 'excellent' ? '✓ Excellent' : '✓ On Track'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-orange-50 rounded-lg">
        <div className="text-sm text-orange-800">
          <strong>Overall SLA:</strong> 96.5% compliance
        </div>
      </div>
    </div>
  );
};

const ActivityFeed = () => {
  const [visibleActivities, setVisibleActivities] = useState(1);
  const activities = [
    { 
      action: 'project.created', 
      details: 'Mobile App Redesign project started', 
      time: '2 min ago',
      icon: <Target size={14} />,
      color: 'green'
    },
    { 
      action: 'task.completed', 
      details: 'UI mockups approved by Sarah Chen', 
      time: '5 min ago',
      icon: <Zap size={14} />,
      color: 'blue'
    },
    { 
      action: 'sprint.started', 
      details: 'Sprint 24 kicked off with 12 stories', 
      time: '1 hour ago',
      icon: <Calendar size={14} />,
      color: 'purple'
    },
    { 
      action: 'member.invited', 
      details: 'Alex Kumar joined Project Alpha', 
      time: '2 hours ago',
      icon: <Users size={14} />,
      color: 'orange'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleActivities(prev => prev >= activities.length ? 1 : prev + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [activities.length]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={20} className="text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Activity Stream</h3>
      </div>
      
      <div className="space-y-3">
        {activities.slice(0, visibleActivities).map((activity, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 animate-fadeIn"
            style={{ animationDelay: `${index * 200}ms` }}
          >
            <div className={`p-1 rounded-full text-white ${
              activity.color === 'green' ? 'bg-green-500' :
              activity.color === 'blue' ? 'bg-blue-500' :
              activity.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
            }`}>
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {activity.action}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {activity.details}
              </div>
              <div className="text-xs text-gray-500">
                {activity.time}
              </div>
            </div>
          </div>
        ))}
        
        {visibleActivities < activities.length && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              Loading more activities...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReportsActivity = () => {
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
    <section id="reports" ref={sectionRef} className="py-24 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Data-driven <span className="text-blue-600">insights</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time analytics and reporting to keep your teams aligned and projects on track.
          </p>
        </div>

        <div className={`grid md:grid-cols-2 gap-8 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <VelocityChart />
          <WorkloadChart />
          <SLATracker />
          <ActivityFeed />
        </div>
      </div>
    </section>
  );
};

export default ReportsActivity;