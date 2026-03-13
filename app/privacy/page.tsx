import PageBackButton from "../components/page-back-button";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <PageBackButton label="Back" />
          <h1 className="text-2xl font-semibold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: March 8, 2026</p>

          <div className="mt-6 space-y-6 text-sm text-gray-700 leading-6">
            <section>
              <h2 className="text-base font-semibold text-gray-900">Overview</h2>
              <p className="mt-2">
                MealMate helps students track meal swipes by reading meal receipt emails from Gmail.
                This Privacy Policy explains what data we access, how we use it, and how long we keep
                it.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Data We Access</h2>
              <p className="mt-2">
                With your permission, we access your Gmail using the read-only scope to identify meal
                receipt messages and parse fields such as order date/time, store name, order ID, and
                meal count.
              </p>
              <p className="mt-2">
                We also store basic account data needed for authentication and secure session handling.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">How We Use Data</h2>
              <p className="mt-2">
                We use your data only to provide MealMate features, including weekly totals, recent
                history, and manual rescan functionality.
              </p>
              <p className="mt-2">
                We do not sell personal data and do not use your Gmail content for advertising.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Data Storage and Retention</h2>
              <p className="mt-2">
                Parsed swipe records are stored in our database. Records older than 180 days are
                automatically removed.
              </p>
              <p className="mt-2">
                OAuth tokens are stored so the app can continue syncing until you revoke access.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Your Choices</h2>
              <p className="mt-2">
                You can stop access at any time by revoking MealMate in your Google Account permissions.
                You can also stop using the app at any time.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Security</h2>
              <p className="mt-2">
                We use industry-standard controls to protect data in transit and at rest. No system is
                perfectly secure, but we continuously work to reduce risk.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Contact</h2>
              <p className="mt-2">
                For privacy questions, contact: <span className="font-medium">support@mealmate-usc.com</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

