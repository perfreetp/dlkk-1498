import { Check } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
}

interface StepsProps {
  steps: Step[];
  current: number;
}

export function Steps({ steps, current }: StepsProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index < current
                  ? 'bg-success text-white'
                  : index === current
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < current ? <Check size={16} /> : index + 1}
            </div>
            <div className="mt-2 text-center">
              <div
                className={`text-sm font-medium ${
                  index <= current ? 'text-gray-800' : 'text-gray-400'
                }`}
              >
                {step.title}
              </div>
              {step.description && (
                <div className="text-xs text-gray-400 mt-0.5">{step.description}</div>
              )}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-20 h-0.5 mx-2 mb-6 ${
                index < current ? 'bg-success' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
