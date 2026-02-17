import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card className="w-full max-w-[600px] mx-auto shadow-2xl border-border dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
                <CardDescription className="text-center">Enter your credentials to access the knowledge base.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            {/* <label htmlFor="email" className="sr-only">Email</label> */}
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="name@company.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-9"
                                required 
                            />
                        </div>
                        <div className="space-y-1">
                            {/* <label htmlFor="password" className="sr-only">Password</label> */}
                            <Input 
                                id="password" 
                                type="password" 
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-9"
                                required 
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="text-center text-sm text-fg-secondary dark:text-gray-400">
                        Don't have an account?{" "}
                        <Link to="/signup" className="underline hover:text-fg dark:hover:text-white">Sign up</Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
};

export default Login;
