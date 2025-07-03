import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// Define a more flexible type for plan features
interface PlanFeatures {
  [category: string]: {
    [feature: string]: boolean | string;
  };
}

interface Plan {
  id: string;
  name: string;
  features: PlanFeatures;
}

interface Props {
  plans: Plan[];
}

const PlanComparisonTable: React.FC<Props> = ({ plans }) => {
  // Extract all unique feature keys from all plans to build the table rows
  const allFeatureKeys: { category: string; feature: string }[] = [];
  const featureSet = new Set<string>();

  plans.forEach(plan => {
    Object.keys(plan.features).forEach(category => {
      Object.keys(plan.features[category]).forEach(feature => {
        const key = `${category}:${feature}`;
        if (!featureSet.has(key)) {
          featureSet.add(key);
          allFeatureKeys.push({ category, feature });
        }
      });
    });
  });

  const formatKey = (key: string) => {
    return key.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 overflow-x-auto">
      <table className="min-w-full bg-gray-900 border border-gray-700 rounded-lg">
        <thead>
          <tr>
            <th className="p-4 text-left text-lg font-bold">Features</th>
            {plans.map(plan => (
              <th key={plan.id} className="p-4 text-center text-lg font-bold">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allFeatureKeys.map(({ category, feature }, index) => (
            <tr key={index} className="border-t border-gray-700 hover:bg-gray-800">
              <td className="p-4 font-medium">{formatKey(feature)}</td>
              {plans.map(plan => {
                const value = plan.features[category]?.[feature];
                return (
                  <td key={plan.id} className="p-4 text-center">
                    {typeof value === "boolean" ? (
                      value ? (
                        <CheckCircle2 className="mx-auto text-green-500" />
                      ) : (
                        <XCircle className="mx-auto text-red-500" />
                      )
                    ) : (
                      <span>{value || "-"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlanComparisonTable;
