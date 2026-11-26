// The Stack Garden mark: the master artwork (public/logo.jpeg), cropped to its
// ensō circle by `npm run logo`. Statically imported so the URL works with basePath.

import Image from "next/image";
import logo from "@/assets/logo-mark-256.png";

export default function BrandMark({ size, className = "" }: { size: number; className?: string }) {
  return (
    <Image
      src={logo}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      priority
      className={`rounded-full ${className}`}
    />
  );
}
