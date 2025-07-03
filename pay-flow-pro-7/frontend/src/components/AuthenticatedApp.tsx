import React from "react";
import { UserGuard } from "app/auth";
import { Outlet } from "react-router-dom";
import AppLayout from "components/AppLayout";

const AuthenticatedApp = () => {
  return (
    <UserGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </UserGuard>
  );
};

export default AuthenticatedApp;