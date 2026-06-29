import React from "react";

interface AdminPlaceholderTabProps {
  title: string;
  description: string;
}

export const AdminPlaceholderTab: React.FC<AdminPlaceholderTabProps> = ({ title, description }) => {
  return (
    <div className="bg-orbit-card border border-orbit-border rounded-3xl p-8 space-y-4">
      <h1 className="text-2xl font-bold text-orbit-white">{title}</h1>
      <p className="text-sm text-orbit-gray-text">
        {description}
      </p>
      <div className="rounded-2xl border border-orbit-border/60 bg-orbit-bg p-6 text-orbit-gray-text">
        <p className="text-sm leading-6">
          This admin section is currently using the placeholder view. When the real implementation is ready, the full content will appear here.
        </p>
      </div>
    </div>
  );
};
