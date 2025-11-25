
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  target: 'center' | 'sidebar' | 'chat' | 'visualizer' | 'crm-button';
  title: string;
  description: string;
  position: { top?: string; left?: string; right?: string; bottom?: string; width?: string; height?: string };
  tooltipPosition: 'left' | 'right' | 'top' | 'bottom' | 'center';
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      target: 'center',
      title: 'Welcome to AdvancementOS',
      description: 'This is your AI-powered workforce for Higher Education fundraising. Let’s take a quick tour of your new capabilities.',
      position: { top: '50%', left: '50%', width: '0px', height: '0px' }, // Invisible center point
      tooltipPosition: 'center'
    },
    {
      target: 'sidebar',
      title: 'Your Agent Fleet',
      description: 'On the left, you have access to 16 specialized agents. From "Sherlock" for prospect research to "The Rainmaker" for corporate deals. Click an agent to switch roles instantly.',
      position: { top: '0', left: '0', width: '320px', height: '100%' }, // Matches sidebar width (w-80)
      tooltipPosition: 'right'
    },
    {
      target: 'chat',
      title: 'The Command Center',
      description: 'This is where the work happens. Chat naturally with your agents. Ask them to generate lists, draft emails, or analyze strategy. They have memory and context of your organization.',
      position: { top: '0', left: '320px', right: '384px', height: '100%' }, // Between sidebar and visualizer
      tooltipPosition: 'bottom'
    },
    {
      target: 'visualizer',
      title: 'Visual Intelligence',
      description: 'Agents like "Pulse" and "Loop Builder" generate real-time charts and Endowment Loop models here. Watch your data come to life as you chat.',
      position: { top: '0', right: '0', width: '384px', height: '100%' }, // Matches visualizer width (w-96)
      tooltipPosition: 'left'
    },
    {
      target: 'crm-button',
      title: 'Integrated CRM',
      description: 'Click "CRM Database" to view the prospects your agents find. When an agent says "I added this to the database," it appears here instantly.',
      position: { top: '76px', left: '16px', width: '288px', height: '60px' }, // Approximate position of CRM button
      tooltipPosition: 'right'
    },
    {
      target: 'center',
      title: 'You are Ready',
      description: 'Start by asking Sherlock to find prospects, or ask The Steward to draft an email. Your AI team is standing by.',
      position: { top: '50%', left: '50%', width: '0px', height: '0px' },
      tooltipPosition: 'center'
    }
  ];

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Calculate CSS for the spotlight effect (using box-shadow)
  // We use a massive box shadow to dim the rest of the screen
  const spotlightStyle: React.CSSProperties = {
    position: 'fixed',
    top: step.position.top,
    left: step.position.left,
    right: step.position.right,
    bottom: step.position.bottom,
    width: step.position.width,
    height: step.position.height,
    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)', // Slate-900 with opacity
    borderRadius: step.target === 'center' ? '50%' : '8px',
    pointerEvents: 'none',
    transition: 'all 0.4s ease-in-out',
    zIndex: 40
  };

  // Helper to position the tooltip card relative to the spotlight
  const getTooltipStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 50,
      transition: 'all 0.4s ease-in-out',
    };

    if (step.tooltipPosition === 'center') {
      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    if (step.tooltipPosition === 'right') {
      return { ...base, top: '20%', left: parseInt(step.position.width || '0') + 20 + 'px' };
    }
    if (step.tooltipPosition === 'left') {
      return { ...base, top: '20%', right: parseInt(step.position.width || '0') + 20 + 'px' };
    }
    if (step.tooltipPosition === 'bottom') {
        return { ...base, top: '120px', left: '50%', transform: 'translateX(-50%)' };
    }

    return base;
  };

  return (
    <>
      {/* The Spotlight Hole */}
      <div style={spotlightStyle} className="hidden md:block" />
      {/* Mobile overlay fallback */}
      <div className="fixed inset-0 bg-slate-900/80 z-40 md:hidden" />

      {/* The Card */}
      <div 
        style={getTooltipStyle()} 
        className="bg-white w-[90vw] max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-300"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            {isLastStep ? <Check className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <button 
            onClick={onSkip}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
        <p className="text-slate-600 mb-6 leading-relaxed">
          {step.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200'
                }`} 
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-200"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
