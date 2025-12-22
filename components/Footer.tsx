'use client';

import { trackPhoneClick, trackWhatsAppClick } from '@/lib/tracking';

export default function Footer() {
  const phoneNumber = '+1234567890'; // Replace with your actual number
  const whatsappNumber = '+1234567890'; // Replace with your actual number

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">GoogleAds Pro</h3>
            <p className="text-gray-400">
              Expert Google Ads management services to grow your business.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <a href="/google-ads" className="text-gray-400 hover:text-white">
                  Google Ads Management
                </a>
              </li>
              <li>
                <a href="/google-ads/packages" className="text-gray-400 hover:text-white">
                  Packages
                </a>
              </li>
              <li>
                <a href="/case-studies" className="text-gray-400 hover:text-white">
                  Case Studies
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="/free-audit" className="text-gray-400 hover:text-white">
                  Free Audit
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={`tel:${phoneNumber}`}
                  onClick={() => trackPhoneClick(phoneNumber)}
                  className="text-gray-400 hover:text-white"
                >
                  {phoneNumber}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  onClick={() => trackWhatsAppClick(whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} GoogleAds Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
