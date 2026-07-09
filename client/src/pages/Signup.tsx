import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, Mail, CheckCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const Signup = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    // "personal" | "team"
    const [accountType, setAccountType] = useState<"personal" | "team">("personal");
    const [companyName, setCompanyName] = useState("");

    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        if (accountType === 'team' && !companyName) {
            setError("Please enter your company or team name");
            setIsLoading(false);
            return;
        }
        
        try {
            // For personal accounts, we'll use their name as the workspace name, or just "Personal Workspace"
            const finalCompanyName = accountType === 'team' ? companyName : `${fullName}'s Workspace`;
            
            // Pass accountType instead of roleName
            const result = await signUp(email, password, fullName, finalCompanyName, accountType);
            
            if (result?.needsConfirmation) {
                setConfirmationEmail(result.email);
                setShowEmailConfirmation(true);
            } else {
                navigate("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Failed to create account");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "flex w-full h-11 px-4 py-2 bg-black/5 dark:bg-white/[0.03] border border-border dark:border-white/10 text-fg placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm";

    if (showEmailConfirmation) {
        return (
            <div className="w-full max-w-[460px] mx-auto">
                <div className="border border-border/50 dark:border-white/5 glass shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden">
                    <div className="pt-8 pb-4 px-6 flex flex-col items-center gap-4 text-center">
                        <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-display font-light text-fg">Check your email</h2>
                        <p className="text-sm text-fg-secondary">
                            We've sent a confirmation link to<br />
                            <span className="font-semibold text-fg mt-1 block">{confirmationEmail}</span>
                        </p>
                    </div>
                    <div className="space-y-4 px-6">
                        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 rounded-xl p-4 text-xs text-purple-700 dark:text-purple-300">
                            <div className="flex gap-3 text-left">
                                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold mb-1 text-fg">Next steps:</p>
                                    <ol className="list-decimal list-inside space-y-1.5 text-fg-secondary">
                                        <li>Check your email inbox</li>
                                        <li>Click the confirmation link</li>
                                        <li>You'll be redirected to the dashboard</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-center text-fg-secondary/85">
                            Didn't receive the email? Check your spam folder or contact support.
                        </p>
                    </div>
                    <div className="pt-6 pb-8 px-6">
                        <button 
                            className="w-full h-11 rounded-full border border-border dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-fg text-sm font-semibold transition-all cursor-pointer bg-transparent"
                            onClick={() => navigate("/login")}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[420px] mx-auto">
            <div className="border border-border/50 dark:border-white/5 glass shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden">
                <div className="space-y-2 pt-8 pb-4 px-8 text-center select-none">
                    <h2 className="text-2xl font-display font-light text-fg tracking-tight">Create an account</h2>
                    <p className="text-sm text-fg-secondary font-light">Your workspace's technical decisions, always findable.</p>
                </div>
                <form onSubmit={handleSignup}>
                    <div className="space-y-5 px-8 text-left">
                        {error && (
                            <div className="flex items-center gap-2.5 p-3.5 text-xs text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                                <span className="leading-tight text-left font-medium">{error}</span>
                            </div>
                        )}
                        
                        <div className="space-y-1.5">
                            <label className="text-[0.65rem] font-mono tracking-wide text-fg-secondary uppercase ml-1">Full Name</label>
                            <input 
                                placeholder="e.g. Praveen Kumar" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={inputClasses}
                                required 
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[0.65rem] font-mono tracking-wide text-fg-secondary uppercase ml-1">Email</label>
                            <input 
                                type="email" 
                                placeholder="name@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputClasses}
                                required 
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[0.65rem] font-mono tracking-wide text-fg-secondary uppercase ml-1">Password</label>
                            <input 
                                type="password" 
                                placeholder="Create Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClasses}
                                required 
                                minLength={6}
                            />
                        </div>

                        {/* Account Type Toggle */}
                        <div className="pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAccountType('personal')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                                        accountType === 'personal' 
                                            ? "border-purple-500/50 bg-purple-500/5 text-purple-600 dark:text-purple-400" 
                                            : "border-border dark:border-white/10 bg-transparent text-fg-secondary hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <User className="h-5 w-5" />
                                    <span className="text-xs font-semibold">Just me</span>
                                    <span className="text-[10px] opacity-70 font-light">Personal / Freelancer</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAccountType('team')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                                        accountType === 'team' 
                                            ? "border-purple-500/50 bg-purple-500/5 text-purple-600 dark:text-purple-400" 
                                            : "border-border dark:border-white/10 bg-transparent text-fg-secondary hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <Users className="h-5 w-5" />
                                    <span className="text-xs font-semibold">My team</span>
                                    <span className="text-[10px] opacity-70 font-light">Company / Startup</span>
                                </button>
                            </div>
                        </div>

                        {/* Conditionally show company name */}
                        {accountType === 'team' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in duration-300">
                                <label className="text-[0.65rem] font-mono tracking-wide text-fg-secondary uppercase ml-1">Company / Team Name</label>
                                <input 
                                    placeholder="e.g. Acme Corp Backend" 
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className={inputClasses}
                                    required={accountType === 'team'}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col space-y-4 pt-8 pb-8 px-8">
                        <button 
                            type="submit" 
                            className="w-full h-12 rounded-xl bg-fg text-bg hover:bg-fg/90 active:scale-[0.98] transition-all font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-fg/10 border-0" 
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-bg" />}
                            {isLoading ? "Creating account..." : "Create Account"}
                        </button>
                        <div className="text-center text-xs text-fg-secondary font-mono tracking-wide">
                            Already have an account?{" "}
                            <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 underline underline-offset-4 font-sans font-medium transition-colors">Sign in</Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;

