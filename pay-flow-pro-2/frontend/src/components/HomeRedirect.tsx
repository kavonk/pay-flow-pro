import { useUser } from "@stackframe/react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const HomeRedirect = () => {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return null;
};
