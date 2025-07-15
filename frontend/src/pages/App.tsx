import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stackframe/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle } from "lucide-react";
import { useSubscription } from "utils/useSubscription";
import { useUserRole } from "utils/queryHooks";

const App = () => {
  const navigate = useNavigate();
  const user = useUser();

  // Redirect to dashboard if user is logged in
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  
  const handleStartTrial = () => {
    navigate("/auth/sign-up");
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth/sign-up");
    }
  };
  
  const handleChoosePlan = (plan: string) => {
    if (plan === 'enterprise') {
      navigate('/contact-sales');
    } else {
      navigate(`/auth/sign-up?plan=${plan}`);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
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
            <Button variant="ghost" onClick={() => navigate("/auth/sign-in")}>
              Login
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleStartTrial}>
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
          PayFlow Pro is the all-in-one platform for SMBs to manage invoices, automate payment reminders, and get paid faster with Stripe.
        </p>
        <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6" onClick={handleGetStarted}>
          Get Started for Free
        </Button>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-gray-800/50">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12 tracking-wide">
            Everything you need. Nothing you don't.
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <FeatureCard title="Automated Invoicing">
              Generate and dispatch professional, branded invoices in seconds. Set up recurring billing and focus on your business.
            </FeatureCard>
            <FeatureCard title="Effortless Payments">
              Accept credit cards, SEPA/ACH, and more via our rock-solid Stripe integration. Reduce friction, get paid on time.
            </FeatureCard>
            <FeatureCard title="Intelligent Dunning">
              Automatically send customized email and SMS reminders for overdue payments. Drastically reduce late payments.
            </FeatureCard>
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
          <div className="grid grid-cols-1 lg:grid-cols-4 justify-center items-start gap-6 max-w-7xl mx-auto">
            <PricingCard
              title="Free"
              price="€0"
              period="/ month"
              description="Basic invoicing with email reminders"
              features={[
                "Up to 10 invoices/month",
                "1 seat",
                "Basic email reminders",
                "Pay Now QR codes",
                "1.0% transaction fee"
              ]}
              planSlug="free"
              onChoosePlan={handleChoosePlan}
            />
            <PricingCard
              title="Starter"
              price="€15"
              period="/ month"
              yearlyPrice="€12.50"
              description="Everything Free, plus mobile payments"
              features={[
                "Up to 100 invoices/month",
                "3 seats",
                "Mobile app payments",
                "Bulk-send up to 10",
                "0.8% transaction fee"
              ]}
              planSlug="starter"
              onChoosePlan={handleChoosePlan}
            />
            <PricingCard
              title="Pro"
              price="€35"
              period="/ month"
              yearlyPrice="€29"
              description="All Starter, plus recurring billing & branding"
              features={[
                "Unlimited invoices",
                "10 seats",
                "True recurring billing",
                "Custom branding",
                "Advanced analytics",
                "Priority support",
                "0.5% transaction fee"
              ]}
              isFeatured
              planSlug="pro"
              onChoosePlan={handleChoosePlan}
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              period="pricing"
              description="All Pro, plus dedicated support & white-label"
              features={[
                "Unlimited + SLAs",
                "Unlimited seats",
                "Dedicated account manager",
                "White-label & custom domain",
                "Premium API & integrations",
                "0.3% transaction fee"
              ]}
              planSlug="enterprise"
              onChoosePlan={handleChoosePlan}
            />
          </div>
          
          {/* View All Plans Link */}
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/pricing')}
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
            >
              View All Plans & Features
            </Button>
          </div>
          
          {/* Free CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl border border-purple-500/20">
              <div className="text-left">
                <h4 className="text-xl font-semibold mb-2">Ready to get started?</h4>
                <p className="text-gray-400">Start with the Free plan. Upgrade when you're ready to grow.</p>
              </div>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3" onClick={handleStartTrial}>
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 border-t border-gray-800 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} PayFlow Pro. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="p-8 bg-gray-800 rounded-xl border border-gray-700 transform hover:-translate-y-2 transition-transform duration-300">
      <h4 className="text-xl font-semibold mb-3">{title}</h4>
      <p className="text-gray-400">{children}</p>
  </div>
);

const PricingCard = ({
  title,
  price,
  period,
  yearlyPrice,
  description,
  features,
  isFeatured,
  planSlug,
  onChoosePlan,
}: {
  title: string;
  price: string;
  period?: string;
  yearlyPrice?: string;
  description?: string;
  features: string[];
  isFeatured?: boolean;
  planSlug?: string;
  onChoosePlan?: (plan: string) => void;
}) => {
  const savings = yearlyPrice ? Math.round(((parseFloat(price.replace('€', '')) * 12 - parseFloat(yearlyPrice.replace('€', '')) * 12) / (parseFloat(price.replace('€', '')) * 12)) * 100) : 0;
  
  return (
    <Card
      className={`w-full rounded-2xl transition-all duration-300 hover:scale-105 ${
        isFeatured 
          ? "border-2 border-purple-500 bg-gray-800/50 relative overflow-hidden shadow-2xl shadow-purple-500/20" 
          : "border border-gray-700 bg-gray-800 hover:border-gray-600"
      }`}
    >
      {isFeatured && (
        <div className="absolute top-0 right-0 text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-6 rounded-bl-xl">
          MOST POPULAR
        </div>
      )}
      <CardHeader className="text-center pt-8 pb-4">
        <CardTitle className="text-2xl font-bold tracking-wide">{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-400 mt-2">{description}</p>
        )}
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center mb-2">
            <span className="text-4xl font-bold">{price}</span>
            {period && <span className="text-gray-400 text-lg ml-1">{period}</span>}
          </div>
          {yearlyPrice && savings > 0 && (
            <div className="text-sm text-emerald-400">
              Or {yearlyPrice}/month yearly (Save {savings}%)
            </div>
          )}
        </div>
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={16} />
              <span className="text-gray-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className={`w-full text-lg font-semibold py-6 rounded-xl transition-all duration-300 ${
            isFeatured 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg" 
              : "bg-white text-gray-900 hover:bg-gray-200"
          }`}
          onClick={() => onChoosePlan?.(planSlug || title.toLowerCase())}
        >
          {title === 'Enterprise' ? "Contact Sales" : "Start Free Trial"}
        </Button>
        {title !== 'Enterprise' && (
          <p className="text-xs text-gray-500 text-center mt-3">
            14-day free trial • Cancel anytime
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default App;
