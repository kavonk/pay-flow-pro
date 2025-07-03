import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  CreditCard,
  Users,
  TrendingUp,
  Shield,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FeatureCard from "components/FeatureCard";
import PricingCard from "components/PricingCard";
import brain from "brain";
import { useUser } from "@stackframe/react";

export default function App() {
  const navigate = useNavigate();
  const user = useUser();

  const handleStartTrial = async (plan: string) => {
    if (user) {
      navigate("/dashboard");
    } else {
      await brain.start_trial_new({ plan_slug: plan });
      navigate("/auth/sign-up");
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth/sign-up");
    }
  };

  const handleChoosePlan = (planSlug: string) => {
    navigate(`/pricing?plan=${planSlug}`);
  };

  return (
    <main data-stack-public-page>
      <div
        data-stack-public-page
        className="bg-gray-900 text-white min-h-screen font-sans"
      >
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-lg">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-wider">PayFlow Pro</h1>
            </div>
            <div className="space-x-3">
              <Button variant="ghost" onClick={() => navigate("/pricing")}>
                Pricing
              </Button>
              <Button variant="ghost" onClick={() => navigate("/auth/sign-in")}>
                Login
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => handleStartTrial("free")}
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight tracking-tighter">
            Automated Invoicing,
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Seamless Payments.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            PayFlow Pro is the all-in-one platform for SMBs to manage
            invoices, automate payment reminders, and get paid faster with
            Stripe.
          </p>
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6"
            onClick={handleGetStarted}
          >
            Get Started for Free
          </Button>
        </main>

        {/* Features Section */}
        <section className="py-20 bg-gray-800/50">
          <div className="container mx-auto px-6">
            <h3 className="text-3xl font-bold text-center mb-12 tracking-wide">
              Everything you need. Nothing you don't.
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={
                  <CheckCircle size={48} className="mb-4 text-purple-400" />
                }
                title="Automated Invoice Creation"
                description="Generate professional invoices instantly. Customize templates with your branding and send them with a single click."
              />
              <FeatureCard
                icon={
                  <CreditCard size={48} className="mb-4 text-purple-400" />
                }
                title="Stripe Payment Integration"
                description="Accept payments seamlessly with Stripe. Customers can pay directly from invoices with credit cards, bank transfers, and more."
              />
              <FeatureCard
                icon={<Users size={48} className="mb-4 text-purple-400" />}
                title="Smart Payment Reminders"
                description="Never chase payments again. Set up automated reminder sequences that get progressively more urgent as deadlines approach."
              />
              <FeatureCard
                icon={
                  <TrendingUp size={48} className="mb-4 text-purple-400" />
                }
                title="Cash Flow Analytics"
                description="Track your business performance with detailed analytics. See payment trends, outstanding invoices, and revenue forecasts."
              />
              <FeatureCard
                icon={<Shield size={48} className="mb-4 text-purple-400" />}
                title="Secure & Compliant"
                description="Bank-level security with SOC2 compliance. Your data and your customers' payment information are always protected."
              />
              <FeatureCard
                icon={<Calendar size={48} className="mb-4 text-purple-400" />}
                title="Recurring Billing"
                description="Set up subscription billing for recurring services. Automatic invoice generation and payment collection for steady cash flow."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold mb-4 tracking-wide">
                Simple, Transparent Pricing
              </h3>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Start free forever. Upgrade when your business grows.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 justify-center items-start gap-8 max-w-6xl mx-auto">
              <PricingCard
                title="Starter"
                price="€15"
                period="/ month"
                description="For businesses getting started."
                features={[
                  "200 Invoices/mo",
                  "5 Dunning Rules",
                  "4 User Seats",
                  "Email & SMS Reminders",
                ]}
                planSlug="starter"
                onChoosePlan={handleChoosePlan}
              />
              <PricingCard
                title="Pro"
                price="€35"
                period="/ month"
                description="For growing businesses that need more."
                features={[
                  "Unlimited Invoices",
                  "10 Dunning Rules",
                  "12 User Seats",
                  "Custom Branding",
                  "Advanced Analytics",
                ]}
                isFeatured
                planSlug="pro"
                onChoosePlan={handleChoosePlan}
              />
              <PricingCard
                title="Business"
                price="€59"
                period="/ month"
                description="For scaling companies needing advanced features."
                features={[
                  "Everything in Pro",
                  "25 User Seats",
                  "Full API Access",
                  "White-label Option",
                  "Priority Support",
                ]}
                planSlug="business"
                onChoosePlan={handleChoosePlan}
              />
            </div>

            {/* View All Plans Link */}
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/pricing")}
                className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
              >
                View All Plans & Features
              </Button>
            </div>

            {/* Free CTA */}
            <div className="text-center mt-16">
              <div className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl border border-purple-500/20">
                <div className="text-left">
                  <h4 className="text-xl font-semibold mb-2">
                    Ready to get started?
                  </h4>
                  <p className="text-gray-400">
                    Start with the Free plan. Upgrade when you're ready to
                    grow.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                  onClick={() => handleStartTrial("free")}
                >
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-gray-900 border-t border-gray-800 text-center text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} PayFlow Pro. All rights
            reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
