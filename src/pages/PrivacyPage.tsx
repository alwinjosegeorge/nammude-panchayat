import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 container py-12">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <div className="prose dark:prose-invert max-w-none">
                    <p>Last updated: January 2026</p>
                    <p>
                        This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information
                        when You use the Service and tells You about Your privacy rights and how the law protects You.
                    </p>
                    <h2>Collecting and Using Your Personal Data</h2>
                    <p>
                        When submitting a report, we collect relevant information such as location data and photos to address the issue.
                        Email and phone numbers are collected only if you choose to provide them.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
