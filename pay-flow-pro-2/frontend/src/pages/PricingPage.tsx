import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import brain from "brain";
import { SubscriptionPlan } from "types"; 
import PlanComparisonTable from "components/PlanComparisonTable";
import { CheckCircle2 } from "lucide-react";
import { PLANS } from "app/libs/subscription_plans"; // Import the source of truth

// Define a more specific type for plans used in this component
interface DisplayPlan extends SubscriptionPlan {
  price_yearly: number;
  features: Record<string, any>; // Ensure features is a rich object
}

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const fetchAndProcessPlans = () => {
      try {
        setLoading(true);
        // Use the imported PLANS object directly as the source of truth
        const processedPlans = Object.entries(PLANS).map(([slug, planData]) => {
          const yearly_price = planData.price_yearly || planData.price_monthly * 10;
          return {
            ...planData,
            id: slug,
            slug: slug,
            price_yearly: yearly_price,
            // The features object is already in the correct format
          } as DisplayPlan;
        });
        
        setPlans(processedPlans);
      } catch (err) {
        setError("Failed to process pricing plans. Please check the data source.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessPlans();
  }, []);

  const getPrice = (plan: DisplayPlan) => {
    return billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
  };
  
  // Skeletons and other rendering logic remains the same
  const renderSkeletons = () => (
    [...Array(3)].map((_, i) => (
      <Card key={i} className="bg-gray-900 border-gray-700 rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Skeleton className="h-12 w-1/3 mx-auto my-4" />
          <div className="space-y-4 text-center my-6 w-full">
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className="h-6 w-5/6 mx-auto" />
            ))}
          </div>
          <Skeleton className="h-12 w-full mt-auto" />
        </CardContent>
      </Card>
    ))
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <main className="flex-grow container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold tracking-tighter mb-2">
            Find the Perfect Plan
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Start with a 14-day free trial on our Pro plan. No credit card required. Cancel anytime.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4 my-8">
          <Label htmlFor="billing-cycle-switch" className="text-lg">Monthly</Label>
          <Switch
            id="billing-cycle-switch"
            checked={billingCycle === "yearly"}
            onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
            className="data-[state=checked]:bg-purple-600"
          />
          <Label htmlFor="billing-cycle-switch" className="text-lg">
            Yearly <Badge variant="secondary" className="bg-green-600 text-white ml-2">Save 17%</Badge>
          </Label>
        </div>
        
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? renderSkeletons() : plans
            .filter(p => !['enterprise', 'free_trial'].includes(p.slug))
            .map((plan) => (
            <Card
              key={plan.id}
              className={`bg-gray-900 border-gray-700 rounded-xl shadow-lg transform transition-transform hover:scale-105 relative flex flex-col ${
                plan.slug === 'pro' ? "border-purple-500 border-2" : ""
              }`}
            >
              {plan.slug === 'pro' && (
                <Badge
                  variant="default"
                  className="absolute -top-4 right-4 bg-purple-600 text-white shadow-lg"
                >
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-400 h-12">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center flex-grow">
                <div className="my-4">
                  <span className="text-5xl font-extrabold">€{getPrice(plan)}</span>
                  <span className="text-lg text-gray-400">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                </div>
                <ul className="space-y-3 text-left my-6 text-gray-300">
                   <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                    {plan.invoice_limit === -1 ? 'Unlimited Invoices' : `${plan.invoice_limit} Invoices/mo`}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                    {plan.dunning_rules_limit === -1 ? 'Unlimited Dunning Rules' : `${plan.dunning_rules_limit} Dunning Rules`}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                    {plan.team_member_limit === -1 ? 'Unlimited Seats' : `${plan.team_member_limit} User Seats`}
                  </li>
                </ul>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg text-lg mt-auto">
                  Start 14-Day Free Trial
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {!loading && plans.length > 0 && <PlanComparisonTable plans={plans} />}
      </main>
    </div>
  );
};

export default PricingPage;

