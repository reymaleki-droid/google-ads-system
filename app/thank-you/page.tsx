import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThankYouContent from './ThankYouContent';

export default function ThankYouPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
        <ThankYouContent />
      </Suspense>
      <Footer />
    </>
  );
}
