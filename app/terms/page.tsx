export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: March 8, 2026</p>

          <div className="mt-6 space-y-6 text-sm text-gray-700 leading-6">
            <section>
              <h2 className="text-base font-semibold text-gray-900">Acceptance of Terms</h2>
              <p className="mt-2">
                By using MealMate, you agree to these Terms of Service. If you do not agree, do not
                use the service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Service Description</h2>
              <p className="mt-2">
                MealMate is a student utility that reads eligible Gmail receipts to estimate meal swipe
                usage. Results are informational and may not exactly match official dining balances.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Account and Access</h2>
              <p className="mt-2">
                You must use a valid Google account and authorize required scopes to use core features.
                You are responsible for activity under your account.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Acceptable Use</h2>
              <p className="mt-2">
                You agree not to misuse the service, attempt unauthorized access, interfere with system
                operation, or use the app in violation of law or school policy.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Availability and Changes</h2>
              <p className="mt-2">
                MealMate is provided on an as-is and as-available basis. Features may change, be
                limited, or be removed at any time.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Disclaimers</h2>
              <p className="mt-2">
                We do not guarantee uninterrupted access, complete accuracy, or fitness for a particular
                purpose. Always rely on official university systems for final meal balance information.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Limitation of Liability</h2>
              <p className="mt-2">
                To the maximum extent permitted by law, MealMate and its operators are not liable for
                indirect, incidental, special, consequential, or punitive damages related to use of the
                service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Termination</h2>
              <p className="mt-2">
                You may stop using MealMate at any time. We may suspend or terminate access for misuse,
                abuse, security risk, or legal compliance.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900">Contact</h2>
              <p className="mt-2">
                For terms questions, contact: <span className="font-medium">legal@mealmate-usc.com</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

