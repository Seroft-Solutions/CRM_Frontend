import React from "react";

interface PageTitleProps {
  children: React.ReactNode;
}

export function PageTitle({ children }: PageTitleProps) {
  return <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>;
}
