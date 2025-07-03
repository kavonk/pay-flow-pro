import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FilePlus2 } from "lucide-react";

const DashboardEmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center bg-gray-900/50 rounded-xl border border-dashed border-gray-700 p-12">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 mb-6 shadow-lg">
        <FilePlus2 className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-white">
        Welcome to Your Dashboard
      </h2>
      <p className="mt-2 text-lg text-gray-400 max-w-md mx-auto">
        This is where your financial overview will live. Once you create and send your first invoice, you'll see charts and stats here.
      </p>
      <Button
        onClick={() => navigate("/create-invoice")}
        className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md transition-transform transform hover:scale-105"
      >
        Create Your First Invoice
      </Button>
    </div>
  );
};

export default DashboardEmptyState;
