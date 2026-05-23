"use client";

type ClassicNavProps = {
  html: string;
};

export function ClassicNav({ html }: ClassicNavProps) {
  return (
    <div
      className="classic-nav"
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
