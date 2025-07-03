import { CheckCircle, CreditCard, Users, TrendingUp, Shield, Calendar } from "lucide-react";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="p-8 bg-gray-800 rounded-xl border border-gray-700 transform hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center">
      {icon}
      <h4 className="text-xl font-semibold mb-3">{title}</h4>
      <p className="text-gray-400">{description}</p>
  </div>
);

export default FeatureCard;
