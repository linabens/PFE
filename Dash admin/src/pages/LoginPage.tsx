import { useState } from "react";
import { LoginPage as LoginFormComponent } from "@/components/auth/login-page";
import { CreateAccountPage } from "@/components/auth/create-account-page";
import { ForgotPassword } from "@/components/auth/forgot-password";
import { ParticleBackground } from "@/components/auth/particle-background";

const LoginPage = () => {
  const [view, setView] = useState<"login" | "register" | "forgot">("login");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[hsl(var(--espresso))] flex items-center justify-center p-4">
      {/* Dynamic Background */}
      <ParticleBackground />
      
      {/* Content */}
      <div className="relative z-10 w-full flex justify-center">
        {view === "login" ? (
          <LoginFormComponent 
            onCreateAccount={() => setView("register")} 
            onForgotPassword={() => setView("forgot")}
          />
        ) : view === "register" ? (
          <CreateAccountPage 
            onBackToLogin={() => setView("login")} 
            onSuccess={() => setView("login")}
          />
        ) : (
          <ForgotPassword onBackToLogin={() => setView("login")} />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
