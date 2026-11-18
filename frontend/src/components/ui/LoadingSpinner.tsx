import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = 'md', text = 'Loading...', fullPage = false }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} rounded-full border-2 border-sky-400/20 border-t-sky-400 animate-spin`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
  if (fullPage) return <div className="flex items-center justify-center min-h-64">{content}</div>;
  return content;
}
