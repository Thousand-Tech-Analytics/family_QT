type SectionTitleProps = {
  title: string;
  description?: string;
};

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-bold">{title}</h2>
      {description ? <p className="text-sm leading-6 text-muted">{description}</p> : null}
    </div>
  );
}
