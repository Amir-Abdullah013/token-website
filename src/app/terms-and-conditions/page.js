'use client';

import Layout from '@/components/Layout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

export default function TermsAndConditions() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Terms and Conditions
          </h1>
          <p className="text-slate-400">Last updated: {lastUpdated}</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
          <CardContent className="p-8 text-slate-300 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing or using the Von Token Platform, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you disagree with any part of the terms, then you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on Von Token Platform's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Modify or copy the materials;</li>
                <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                <li>Attempt to decompile or reverse engineer any software contained on the website;</li>
                <li>Remove any copyright or other proprietary notations from the materials; or</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Cryptocurrency Risks</h2>
              <p>
                You acknowledge that cryptocurrency trading and token management involve significant risks. The value of cryptocurrencies can be extremely volatile and unpredictable. You are solely responsible for any decisions you make regarding buying, selling, or holding digital assets.
              </p>
              <p className="mt-2 text-amber-400/80">
                Past performance is not indicative of future results. We do not guarantee any profit or return on investment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. User Accounts</h2>
              <p>
                When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
              </p>
              <p className="mt-2">
                You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Disclaimer</h2>
              <p>
                The materials on Von Token Platform's website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Limitations</h2>
              <p>
                In no event shall Von Token Platform or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the company is established, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
