import { useAuth } from "utils/useAuth";
import { useStackApp, type CurrentInternalServerUser, type CurrentUser } from "@stackframe/react";
import * as React from "react";
import { createContext, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";

type AuthGuardContextType = {
  user: CurrentUser | CurrentInternalServerUser;
};

const AuthGuardContext = createContext<AuthGuardContextType | undefined>(
  undefined,
);

/**
 * Hook to access the logged in user from within a <AuthGuard> component.
 */
export const useAuthGuardContext = () => {
  const context = useContext(AuthGuardContext);

  if (context === undefined) {
    throw new Error("useAuthGuardContext must be used within a <AuthGuard>");
  }

  return context;
};

const writeToLocalStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};


export const AuthGuard = (props: {
  children: React.ReactNode;
}) => {
  const app = useStackApp()
  const { isAuthenticated, isLoading, user } = useAuth();

  const { pathname } = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    const queryParams = new URLSearchParams(window.location.search);

    // Don't set the next param if the user is logging out
    // to avoid ending up in an infinite redirect loop
    if (pathname !== app.urls.signOut) {
      writeToLocalStorage('dtbn-login-next', pathname);
      queryParams.set("next", pathname);
    }

    const queryString = queryParams.toString();

    return <Navigate to={`${app.urls.signIn}?${queryString}`} replace={true} />;
  }

  return (
    <AuthGuardContext.Provider value={{ user }}>
      {props.children}
    </AuthGuardContext.Provider>
  );
};
