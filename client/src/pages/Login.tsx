import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";

const Login = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        try {
            await signIn(email, password);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[440px] mx-auto">
            <div className="border border-border/40 dark:border-white/5 glass shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden text-left">
                <div className="space-y-2 pt-6 pb-4 px-6 text-center select-none">
                    <h2 className="text-2xl lg:text-3xl font-display font-light text-fg">Welcome back</h2>
                    <p className="text-xs lg:text-sm text-fg-secondary">Enter your credentials to access the knowledge base.</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="space-y-5 px-6">
                        {error && (
                            <div className="flex items-center gap-2.5 p-3.5 text-xs text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                                <span className="leading-tight text-left font-medium">{error}</span>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-1.5 text-left">
                                <label htmlFor="email" className="text-[0.65rem] font-mono tracking-wide text-fg-secondary uppercase ml-1">Email Address</label>
                                <input 
                                    id="email" 
                                    type="email" 
                                    placeholder="name@company.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex w-full h-10 px-3 py-2 bg-black/5 dark:bg-white/[0.03] border border-border dark:border-white/10 text-fg placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label htmlFor="password" className="text-[0.65rem] font-mono tracking-wide text-fg-secondary uppercase ml-1">Password</label>
                                <input 
                                    id="password" 
                                    type="password" 
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex w-full h-10 px-3 py-2 bg-black/5 dark:bg-white/[0.03] border border-border dark:border-white/10 text-fg placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                                    required 
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-4 pt-4 pb-6 px-6">
                        <button 
                            type="submit" 
                            className="w-full h-11 rounded-full bg-fg text-bg hover:bg-fg/90 hover:scale-[1.01] active:scale-[0.99] transition-all font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-fg/5 border-0" 
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-bg" />}
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                        <div className="text-center text-xs text-fg-secondary font-mono tracking-wide">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 underline underline-offset-4 font-sans font-medium transition-colors">Sign up</Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
