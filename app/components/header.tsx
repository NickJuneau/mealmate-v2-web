import Link from "next/link";

const Header = () => {
  return (
    <nav
      className="fixed w-full top-0 start-0 border-b border-default bg-white z-50"
      role="banner"
      style={{ height: "var(--header-height, 4rem)" }}
    >
      <div className="max-w-7xl flex items-center justify-between mx-auto p-4 h-full">
        <a href="/" className="flex items-center space-x-3">
          <img src="/test-logo.png" className="h-7" alt="MealMate Logo" />
          <span className="text-xl font-semibold whitespace-nowrap">
            MealMate
            <span className="ml-1 text-xs align-baseline">v2</span>
          </span>
        </a>

        <div className="flex items-center space-x-6">
          <Link href="/" className="text-lg font-medium text-black hover:text-gray-700 transition-colors">Home</Link>
          <Link href="/history" className="text-lg font-medium text-black hover:text-gray-700 transition-colors">History</Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
