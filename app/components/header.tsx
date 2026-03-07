'use client';

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

const Header = () => {
  const { status } = useSession();

  return (
    <nav
      className="fixed w-full top-0 start-0 border-b border-default bg-white z-50"
      role="banner"
      style={{ height: "var(--header-height, 4rem)" }}
    >
      <div className="max-w-7xl flex items-center justify-between mx-auto px-3 sm:px-4 h-full">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/mealmate-main-logo.svg"
            alt="MealMate Logo"
            width={150}
            height={120}
            className="h-auto w-[118px] sm:w-[150px]"
          />
          
          {/* <img src="/test-logo.png" className="h-7" alt="MealMate Logo" /> */}          
          {/* <span className="text-xl font-semibold whitespace-nowrap">
            MealMate
            <span className="ml-1 text-xs align-baseline">v2</span>
          </span> */}
        </Link>

        <div className="flex items-center space-x-3 sm:space-x-6">
          <Link href="/" className="text-sm sm:text-lg font-medium text-black hover:text-gray-700 transition-colors">Home</Link>
          <Link href="/history" className="text-sm sm:text-lg font-medium text-black hover:text-gray-700 transition-colors">History</Link>

          {status === "authenticated" ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="inline-flex items-center rounded-md bg-[#9C000D] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#B30012]"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Loading..." : (
                <>
                  <span className="sm:hidden">Sign In</span>
                  <span className="hidden sm:inline">Sign In with Google</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
