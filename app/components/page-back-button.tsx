'use client';

import { useRouter } from "next/navigation";

type PageBackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export default function PageBackButton({
  fallbackHref = "/",
  label = "Back",
}: PageBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-3 inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C000D]/20"
      aria-label={label}
    >
      <span aria-hidden="true" className="text-base leading-none">
        &larr;
      </span>
      <span>{label}</span>
    </button>
  );
}
