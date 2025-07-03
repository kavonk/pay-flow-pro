import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PricingCard = ({
  title,
  price,
  period,
  description,
  features,
  isFeatured,
  planSlug,
  onChoosePlan,
}: {
  title: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  isFeatured?: boolean;
  planSlug?: string;
  onChoosePlan?: (plan: string) => void;
}) => {
  return (
    <Card
      className={`w-full rounded-2xl transition-all duration-300 flex flex-col hover:scale-105 ${
        isFeatured 
          ? "border-2 border-purple-500 bg-gray-800/50 relative overflow-hidden shadow-2xl shadow-purple-500/40" 
          : "border border-gray-700 bg-gray-900 hover:border-purple-500/50"
      }`}
    >
      {isFeatured && (
        <div className="absolute top-0 right-0 text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-6 rounded-bl-xl z-10">
          MOST POPULAR
        </div>
      )}
      <CardHeader className="text-center pt-10 pb-4">
        <CardTitle className="text-3xl font-bold tracking-wider">{title}</CardTitle>
        {description && (
          <p className="text-md text-gray-400 mt-2 px-4">{description}</p>
        )}
      </CardHeader>
      <CardContent className="p-8 pt-0 flex flex-col flex-grow">
        <div className="text-center my-6 flex-grow">
          <div className="flex items-baseline justify-center mb-6">
            <span className="text-6xl font-extrabold tracking-tighter">{price}</span>
            {period && <span className="text-gray-400 text-xl ml-2">{period}</span>}
          </div>
          <ul className="space-y-4 mb-10 text-left">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="text-green-500 mr-3 flex-shrink-0 mt-1" size={18} />
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto">
          <Button
            className={`w-full text-lg font-bold py-6 rounded-xl transition-all duration-300 ${
              isFeatured 
                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/50" 
                : "bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10"
            }`}
            onClick={() => onChoosePlan?.(planSlug || title.toLowerCase())}
          >
            Start 14-Day Trial
          </Button>
          <p className="text-xs text-gray-500 text-center mt-4">
            No credit card required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingCard;
