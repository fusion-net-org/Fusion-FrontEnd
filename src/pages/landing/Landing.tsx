// src/App.tsx
import React from 'react';
import Navbar from '../../components/Landing/Navbar';
import Hero from '../../components/Landing/Hero';
import FeatureGallery from '../../components/Landing/FeatureGallery';
import WorkflowsVisual from '../../components/Landing/WorkflowsVisual';
import ProjectsSnapshot from '../../components/Landing/ProjectsSnapshot';
import ReportsActivity from '../../components/Landing/ReportsActivity';
import SecuritySection from '../../components/Landing/SecuritySection';
import FAQ from '../../components/Landing/FAQ';
import ClosingCTA from '../../components/Landing/ClosingCTA';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <FeatureGallery />
      <WorkflowsVisual />
      <ProjectsSnapshot />
      <ReportsActivity />
      <SecuritySection />
      <FAQ />
      <ClosingCTA />
    </div>
  );
}

export default App;
