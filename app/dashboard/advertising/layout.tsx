import type { ReactNode } from "react";

export default function AdvertisingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="w-full">{children}</div>;
}
