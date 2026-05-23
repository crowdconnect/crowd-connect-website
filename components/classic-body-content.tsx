"use client";

type ClassicBodyContentProps = {
  html: string;
};

export function ClassicBodyContent({ html }: ClassicBodyContentProps) {
  return (
    <div
      className="classic-body-content"
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
