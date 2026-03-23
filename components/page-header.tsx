import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="space-y-3 px-1 pb-1 pt-2">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-[0.18em] text-accent uppercase">
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1 className="text-[30px] leading-10 font-bold tracking-tight">{title}</h1>
            <p className="max-w-sm text-sm leading-6 text-muted">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}
