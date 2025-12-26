import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy | Google Ads Management',
  description: 'Privacy policy for Google Ads management platform - data collection, usage, and user rights',
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-12">Last Updated: December 26, 2025</p>

          {/* Introduction */}
          <section className="mb-12">
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              ZYX Marketing Management LLC (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates this platform to provide Google Ads campaign performance reporting services. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              By using this platform, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* Section 1 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Google Account Information:</strong> When you authenticate via Google OAuth, we receive your email address and basic profile information.</li>
              <li><strong>Google Ads Authorization:</strong> OAuth access tokens and refresh tokens that allow us to access your Google Ads data on your behalf.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1.2 Google Ads Data</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Campaign Performance Metrics:</strong> Impressions, clicks, cost, conversions, and other campaign performance data.</li>
              <li><strong>Account Structure:</strong> Campaign names, ad group names, and account hierarchy information.</li>
              <li><strong>Historical Data:</strong> Past performance data for trend analysis and reporting.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Log Data:</strong> IP addresses (hashed), browser type, access times, and pages viewed.</li>
              <li><strong>API Usage Logs:</strong> Timestamps and requested data ranges for all Google Ads API queries.</li>
              <li><strong>Session Information:</strong> Authentication session data for security purposes.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            
            <p className="text-base text-gray-700 mb-4">We use the collected information exclusively for the following purposes:</p>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Display Campaign Performance:</strong> Retrieve and display your Google Ads performance data in the platform interface.</li>
              <li><strong>Generate Reports:</strong> Create performance reports and historical trend analysis.</li>
              <li><strong>Authenticate Users:</strong> Verify your identity and maintain secure access to your data.</li>
              <li><strong>Security Monitoring:</strong> Detect and prevent unauthorized access or abuse.</li>
              <li><strong>Platform Improvement:</strong> Analyze usage patterns to improve platform functionality (aggregated, non-identifiable data only).</li>
            </ul>

            <p className="text-base text-gray-700 mt-4 font-semibold">
              We do NOT use your Google Ads data for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Advertising or marketing purposes</li>
              <li>Selling or sharing with third parties</li>
              <li>Training machine learning models</li>
              <li>Any purpose other than displaying your data back to you</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Storage and Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 Data Storage</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Database:</strong> All data is stored in a PostgreSQL database managed by Supabase with enterprise-grade security.</li>
              <li><strong>Encryption:</strong> OAuth tokens are encrypted at rest using AES-256 encryption.</li>
              <li><strong>Access Control:</strong> Row-level security policies ensure users can only access their own data.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Data Transmission</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>HTTPS Only:</strong> All data transmission uses TLS 1.2 or higher encryption.</li>
              <li><strong>Google Ads API:</strong> All communication with Google Ads API occurs over secure HTTPS connections.</li>
              <li><strong>Token Protection:</strong> OAuth tokens are never exposed in client-side code, URLs, or logs.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 Access Controls</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Database Access:</strong> Limited to application servers using service role credentials only.</li>
              <li><strong>Administrative Access:</strong> Platform administrators cannot directly access user OAuth tokens.</li>
              <li><strong>Audit Logging:</strong> All database access is logged for security monitoring.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Retention</h2>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Campaign Performance Data:</strong> Stored for 12 months, then automatically deleted.</li>
              <li><strong>API Usage Logs:</strong> Retained for 90 days for security monitoring.</li>
              <li><strong>OAuth Tokens:</strong> Stored until you revoke access or delete your account.</li>
              <li><strong>Account Information:</strong> Retained while your account is active.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing and Third Parties</h2>
            
            <p className="text-base text-gray-700 mb-4">
              We do not sell, trade, or share your personal information or Google Ads data with third parties, except:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Service Providers:</strong> We use Supabase for database hosting and Vercel for application hosting. These providers have access to data only to perform services on our behalf and are obligated to protect your information.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred (you will be notified in advance).</li>
            </ul>

            <p className="text-base text-gray-700 mt-4 font-semibold">
              We never share your Google Ads data with advertisers, marketers, or data brokers.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.1 Access and Export</h3>
            <p className="text-base text-gray-700 mb-2">
              You can access all your data through the platform interface. You may export your Google Ads performance data at any time in CSV format.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.2 Revoke Access</h3>
            <p className="text-base text-gray-700 mb-2">
              You can revoke our access to your Google Ads data at any time through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Google Account Security Settings: <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://myaccount.google.com/permissions</a></li>
              <li>Platform disconnect button in your account settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.3 Data Deletion</h3>
            <p className="text-base text-gray-700 mb-2">
              You have the right to request deletion of your data. To request deletion:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Contact us at the email address below</li>
              <li>We will delete your data within 30 days of your request</li>
              <li>Some data may be retained for legal compliance purposes (audit logs, 90 days maximum)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.4 GDPR Rights (EEA Residents)</h3>
            <p className="text-base text-gray-700 mb-2">
              If you are located in the European Economic Area, you have additional rights under GDPR:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restriction:</strong> Request limited processing of your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
            
            <p className="text-base text-gray-700 mb-4">
              The platform uses minimal cookies and tracking technologies:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Authentication Cookies:</strong> Required to maintain your login session (session-only, no persistent tracking).</li>
              <li><strong>Security Tokens:</strong> CSRF tokens to prevent security attacks.</li>
            </ul>

            <p className="text-base text-gray-700 mt-4">
              We do NOT use third-party advertising cookies, analytics cookies, or behavioral tracking pixels.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Google Ads API Compliance</h2>
            
            <p className="text-base text-gray-700 mb-4">
              This platform complies with the Google Ads API Terms of Service:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Read-Only Access:</strong> We only read Google Ads data; we never modify your campaigns, ads, or settings.</li>
              <li><strong>Limited Use:</strong> Google Ads data is used solely for displaying performance reports to you.</li>
              <li><strong>No Resale:</strong> We do not sell or share Google Ads data with third parties.</li>
              <li><strong>OAuth 2.0:</strong> Authentication follows Google&apos;s OAuth 2.0 best practices.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
            
            <p className="text-base text-gray-700">
              This platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately so we can delete the information.
            </p>
          </section>

          {/* Section 10 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            
            <p className="text-base text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. When we make material changes:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>We will update the &ldquo;Last Updated&rdquo; date at the top of this page</li>
              <li>We will notify you via email if you have an active account</li>
              <li>Your continued use of the platform after changes constitutes acceptance</li>
            </ul>

            <p className="text-base text-gray-700 mt-4">
              We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            
            <p className="text-base text-gray-700 mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data:
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-base text-gray-900 font-semibold mb-2">ZYX Marketing Management LLC</p>
              <p className="text-base text-gray-700 mb-1">Data Protection Contact</p>
              <p className="text-base text-gray-700 mb-1">Email: privacy@zyx.ae</p>
              <p className="text-base text-gray-700">Response Time: Within 48 hours for privacy inquiries</p>
            </div>

            <p className="text-base text-gray-700 mt-4">
              For GDPR-specific requests from EEA residents, please include &ldquo;GDPR Request&rdquo; in your email subject line.
            </p>
          </section>

          {/* Footer section */}
          <section className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              This Privacy Policy is effective as of December 26, 2025 and applies to all users of the platform.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
