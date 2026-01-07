import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 container py-12">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                <div className="prose dark:prose-invert max-w-none">
                    <p>Last updated: January 2026</p>
                    <p>
                        Please read these terms and conditions carefully before using Our Service.
                    </p>
                    <h2>Acknowledgment</h2>
                    <p>
                        These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company.
                        These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
                    </p>
                    <h2>Report Submission</h2>
                    <p>
                        By submitting a report, you agree that the information provided is accurate and not malicious.
                        We reserve the right to remove reports that violate our community standards.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
