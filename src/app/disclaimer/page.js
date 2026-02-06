'use client';

import Layout from '@/components/Layout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

export default function Disclaimer() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Disclaimer
          </h1>
          <p className="text-slate-400">Last updated: {lastUpdated}</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
          <CardContent className="p-8 text-slate-300 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. General Information</h2>
              <p>
                The information provided by Von Token Platform ("we," "us," or "our") on this website is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability or completeness of any information on the site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Investment Disclaimer</h2>
              <p>
                The content on this website does not constitute financial, investment, legal, or tax advice. You should not treat any opinion expressed on this website as a specific inducement to make a particular investment or follow a particular strategy. Use of your best judgment and consultation with a financial advisor is recommended before making any investment decisions.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                 <p className="text-amber-200 text-sm">
                    <strong>Warning:</strong> Cryptocurrency investments are subject to market risks, including the possible loss of the principal amount invested.
                 </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. External Links Disclaimer</h2>
              <p>
                The site may contain (or you may be sent through the site to) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability or completeness by us.
              </p>
              <p className="mt-2">
                  We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through the site or any website or feature linked in any banner or other advertising.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Professional Advice Disclaimer</h2>
              <p>
                The site cannot and does not contain legal or financial advice. The legal or financial information is provided for general informational and educational purposes only and is not a substitute for professional advice. Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. "As Is" and "As Available" Disclaimer</h2>
              <p>
                The service is provided to you "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, we expressly disclaim all warranties, whether express, implied, statutory or otherwise, with respect to the service.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
