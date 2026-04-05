import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const roleTabs = [
  { label: "Student", value: "student" },
  { label: "Staff", value: "staff" },
  { label: "Admin", value: "admin" },
];

const quickAccessOptions = [
  {
    label: "Biometric",
    icon: "/figmaAssets/icon.svg",
    iconWidth: "w-[18.05px]",
    iconHeight: "h-[19.96px]",
    paddingX: "px-[36px]",
  },
  {
    label: "EDU ID",
    icon: "/figmaAssets/icon-1.svg",
    iconWidth: "w-5",
    iconHeight: "h-5",
    paddingX: "px-[43px]",
  },
  {
    label: "Sign Up",
    icon: "/figmaAssets/icon-3.svg",
    iconWidth: "w-[22px]",
    iconHeight: "h-4",
    paddingX: "px-[41px]",
  },
];

const stats = [
  { value: "98%", label: "FABRIC INTEGRITY RATE" },
  { value: "12m", label: "AVG. CYCLE SPEED" },
];

export const WebsiteLogin = (): JSX.Element => {
  const [activeRole, setActiveRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register, loginPending, registerPending, loginError, registerError } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const isPending = loginPending || registerPending;
  const error = loginError || registerError;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ username, password, role: activeRole });
      } else {
        await register({ username, password, role: activeRole });
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: mode === "login" ? "Login failed" : "Registration failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-[1024px] items-center justify-center px-12 py-[108.5px] relative [background:radial-gradient(50%_50%_at_0%_0%,rgba(0,27,61,1)_0%,rgba(0,27,61,0)_50%),radial-gradient(50%_50%_at_100%_0%,rgba(0,74,198,1)_0%,rgba(0,74,198,0)_50%),radial-gradient(50%_50%_at_100%_100%,rgba(251,250,238,1)_0%,rgba(251,250,238,0)_50%),radial-gradient(50%_50%_at_0%_100%,rgba(37,99,235,1)_0%,rgba(37,99,235,0)_50%),radial-gradient(50%_50%_at_50%_50%,rgba(0,74,198,1)_0%,rgba(0,74,198,0)_50%),linear-gradient(0deg,rgba(251,250,238,1)_0%,rgba(251,250,238,1)_100%)] overflow-x-hidden w-full min-w-[1280px]">
      <div className="grid grid-cols-12 grid-rows-[807px] max-w-6xl w-[1152px] h-fit bg-[#ffffff01] rounded-[48px] overflow-hidden shadow-[0px_40px_100px_#00000026]">
        <div className="relative row-[1_/_2] col-[1_/_6] w-full h-full flex flex-col items-start justify-between p-12 bg-[#fbfaeea6] border-r [border-right-style:solid] border-[#c3c6d726] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)]">
          <div className="flex flex-col items-start gap-8 pt-0 pb-4 px-0 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <img
                src="/laundrolink-logo.png"
                alt="LaundroLink"
                className="h-10 w-auto object-contain"
              />
            </div>

            <header className="flex flex-col items-start gap-2 pt-4 pb-2 px-0 relative self-stretch w-full flex-[0_0_auto] bg-transparent">
              <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                <h1 className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Manrope',Helvetica] font-extrabold text-[#001b3d] text-4xl tracking-[0] leading-[45px]">
                  {mode === "login" ? "Welcome Back" : "Create Account"}
                </h1>
              </div>
              <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Manrope',Helvetica] font-medium text-[#495f84] text-base tracking-[0] leading-6">
                  LaundroLink Premium Ecosystem Access
                </p>
              </div>
            </header>

            <div className="flex items-start justify-center p-1 relative self-stretch w-full flex-[0_0_auto] bg-[#e9e9dd4c] rounded-full">
              {roleTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveRole(tab.value)}
                  className={`flex justify-center px-4 py-2 flex-1 grow rounded-full flex-col items-center relative transition-all ${
                    activeRole === tab.value ? "bg-white shadow-[0px_1px_2px_#0000000d]" : ""
                  }`}
                >
                  <span
                    className={`flex items-center justify-center h-5 mt-[-1.00px] font-bold text-sm text-center tracking-[0] leading-5 whitespace-nowrap relative [font-family:'Manrope',Helvetica] ${
                      activeRole === tab.value ? "text-[#004ac6]" : "text-[#495f84]"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative self-stretch w-full h-20">
                <label className="absolute top-0 left-1 h-4 flex items-center [font-family:'Manrope',Helvetica] font-bold text-[#001b3d] text-xs tracking-[1.20px] leading-4 whitespace-nowrap">
                  USERNAME
                </label>
                <div className="flex flex-col w-full items-start absolute top-6 left-0">
                  <div className="relative flex items-start justify-center pl-12 pr-4 py-[17px] self-stretch w-full flex-[0_0_auto] bg-[#ffffff80] rounded-[32px] overflow-hidden">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. alex.clean"
                      required
                      className="flex-1 bg-transparent outline-none [font-family:'Manrope',Helvetica] text-[#001b3d] placeholder-[#495f8480] text-base"
                    />
                  </div>
                  <img className="absolute h-[28.57%] top-[35.71%] left-5 w-4" alt="Icon" src="/figmaAssets/icon-2.svg" />
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex w-full items-center justify-between relative flex-[0_0_auto]">
                  <label className="flex items-center h-4 mt-[-1.00px] font-bold text-[#001b3d] text-xs tracking-[1.20px] leading-4 whitespace-nowrap relative [font-family:'Manrope',Helvetica]">
                    PASSWORD
                  </label>
                </div>
                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative flex items-start justify-center pl-12 pr-4 py-[17px] self-stretch w-full flex-[0_0_auto] bg-[#ffffff80] rounded-[32px] overflow-hidden">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="flex-1 bg-transparent outline-none [font-family:'Manrope',Helvetica] text-[#001b3d] placeholder-[#495f8480] text-base"
                    />
                  </div>
                  <img className="absolute h-[37.50%] top-[30.36%] left-5 w-4" alt="Icon" src="/figmaAssets/icon-4.svg" />
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm [font-family:'Manrope',Helvetica] font-medium">
                  {error.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="flex items-center justify-center gap-[8.01px] px-0 py-4 h-auto relative self-stretch w-full flex-[0_0_auto] bg-[#004ac6] rounded-[32px] shadow-[0px_15px_30px_#004ac64c] hover:bg-[#003da8] transition-colors disabled:opacity-60"
              >
                <span className="flex items-center justify-center h-6 mt-[-1.00px] font-extrabold text-white text-base text-center tracking-[0] leading-6 whitespace-nowrap relative [font-family:'Manrope',Helvetica]">
                  {isPending ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
                </span>
                {!isPending && (
                  <img className="relative flex-[0_0_auto]" alt="Container" src="/figmaAssets/container-1.svg" />
                )}
              </Button>

              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="self-center text-sm text-[#495f84] [font-family:'Manrope',Helvetica] hover:text-[#004ac6] transition-colors"
              >
                {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
              </button>
            </form>
          </div>

          <div className="pt-12 pb-0 px-0 flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
            <div className="gap-6 flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                <Separator className="flex-1 bg-[#c3c6d74c]" />
                <span className="inline-flex items-center h-[15px] mt-[-1.00px] font-bold text-[#495f8499] text-[10px] tracking-[1.00px] leading-[15px] whitespace-nowrap relative [font-family:'Manrope',Helvetica]">
                  QUICK ACCESS
                </span>
                <Separator className="flex-1 bg-[#c3c6d74c]" />
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                {quickAccessOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => option.label === "Sign Up" && setMode("register")}
                    className={`flex flex-col items-center gap-2 ${option.paddingX} py-3 bg-[#f5f4e8] rounded-[32px] hover:bg-[#ecebd9] transition-colors`}
                  >
                    <img className={`relative ${option.iconWidth} ${option.iconHeight}`} alt="Icon" src={option.icon} />
                    <span className="flex items-center justify-center h-[15px] font-bold text-[#495f84] text-[10px] text-center tracking-[0] leading-[15px] whitespace-nowrap relative [font-family:'Manrope',Helvetica]">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative row-[1_/_2] col-[6_/_13] w-full h-[807px] flex items-center justify-center p-12 bg-[#001b3d]">
          <div className="absolute w-full h-full top-0 left-0 opacity-40 bg-[url(/figmaAssets/ab6axucjv51rupbl4lgwxbndaliwwaeig4mz2kjx-jnpk5-ziqez9eihm3c6clok.png)] bg-cover bg-[50%_50%]" />
          <div className="absolute w-full h-full top-0 left-0 bg-[linear-gradient(55deg,rgba(0,27,61,1)_0%,rgba(0,27,61,0.4)_50%,rgba(0,27,61,0)_100%)]" />
          <img className="absolute right-28 bottom-12 w-12 h-12" alt="Overlay border" src="/figmaAssets/overlay-border-overlayblur.svg" />
          <img className="absolute right-12 bottom-12 w-12 h-12" alt="Overlay border" src="/figmaAssets/overlay-border-overlayblur-1.svg" />
          <div className="inline-flex flex-col max-w-md items-start gap-6 relative flex-[0_0_auto]">
            <div className="relative w-16 h-0.5 bg-[#004ac6]" />
            <div className="pt-2 pb-0 px-0 flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
              <h2 className="w-[418.47px] h-[120px] mt-[-1.00px] font-extrabold text-[#fbfaee] text-5xl tracking-[0] leading-[60px] relative [font-family:'Manrope',Helvetica]">
                Elevating the
                <br />
                fabric of daily life.
              </h2>
            </div>
            <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
              <p className="w-[446.39px] h-[84px] mt-[-1.00px] font-medium text-[#fbfaeeb2] text-xl tracking-[0] leading-7 relative [font-family:'Manrope',Helvetica]">
                Experience the Ethereal Atelier of garment care.
                <br />
                Intelligent tracking for the modern academic
                <br />
                lifestyle.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-6 pb-0 px-0 w-full">
              {stats.map((stat) => (
                <div key={stat.label} className="relative w-full h-fit flex flex-col items-start gap-[3.5px]">
                  <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                    <span className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Manrope',Helvetica] font-extrabold text-[#004ac6] text-3xl tracking-[0] leading-9">
                      {stat.value}
                    </span>
                  </div>
                  <span className="flex items-center h-4 font-bold text-[#fbfaee80] text-xs tracking-[1.20px] leading-4 whitespace-nowrap relative [font-family:'Manrope',Helvetica]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <img className="absolute right-[70px] bottom-[45px] w-[132px] h-[132px]" alt="Floating help button" src="/figmaAssets/floating-help-button.svg" />
    </div>
  );
};
