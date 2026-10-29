import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function Card({ children, className = "", title, description }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-slate-100">
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
