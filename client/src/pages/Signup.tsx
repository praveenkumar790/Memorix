import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, Mail, CheckCircle } from "lucide-react";

const Signup = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roleName, setRoleName] = useState("");
    const [isCustomRole, setIsCustomRole] = useState(false);
    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        // Validation
        if (!roleName) {
            setError("Please select or enter a role");
            setIsLoading(false);
            return;
        }
        
        try {
            const result = await signUp(email, password, fullName, companyName, roleName);
            
            if (result?.needsConfirmation) {
                // Show email confirmation message
                setConfirmationEmail(result.email);
                setShowEmailConfirmation(true);
            } else {
                // Direct login (email confirmation disabled)
                navigate("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Failed to create account");
        } finally {
            setIsLoading(false);
        }
    };

    if (showEmailConfirmation) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-center">Check your email</CardTitle>
                        <CardDescription className="text-center">
                            We've sent a confirmation link to<br />
                            <span className="font-semibold text-fg dark:text-white">{confirmationEmail}</span>
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm text-blue-800 dark:text-blue-300">
                        <div className="flex gap-2">
                            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium mb-1">Next steps:</p>
                                <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                                    <li>Check your email inbox (it may take a few minutes)</li>
                                    <li>Click the confirmation link in the email</li>
                                    <li>You'll be redirected to the dashboard</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-center text-fg-secondary">
                        Didn't receive the email? Check your spam folder or contact support.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate("/login")}
                    >
                        Back to Login
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-[600px] mx-auto shadow-2xl border-border dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                <CardDescription className="text-center">Start building your organizational memory.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    
                    {/* Two Column Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            {/* <label className="sr-only">Full Name</label> */}
                            <Input 
                                placeholder="Full Name" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="h-9"
                                required 
                            />
                        </div>
                        <div className="space-y-1">
                            {/* <label className="sr-only">Company Name</label> */}
                            <Input 
                                placeholder="Company Name" 
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="h-9"
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            {/* <label className="sr-only">Email</label> */}
                            <Input 
                                type="email" 
                                placeholder="name@company.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-9"
                                required 
                            />
                        </div>
                        <div className="space-y-1">
                            {/* <label className="sr-only">Password</label> */}
                            <Input 
                                type="password" 
                                placeholder="Create Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-9"
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        {/* <label className="sr-only">Your Role</label> */}
                        <select 
                            className="flex h-9 w-full rounded-md border border-border dark:border-gray-600 bg-white dark:bg-gray-800 text-fg dark:text-gray-100 px-3 py-1 text-sm font-sans ring-offset-white dark:ring-offset-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg dark:focus-visible:ring-gray-400 placeholder:text-muted-foreground"
                            value={isCustomRole ? "__custom__" : roleName}
                            onChange={(e) => {
                                if (e.target.value === "__custom__") {
                                    setIsCustomRole(true);
                                    setRoleName("");
                                } else {
                                    setIsCustomRole(false);
                                    setRoleName(e.target.value);
                                }
                            }}
                            required
                        >
                            <option value="">Select your role</option>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Engineer">Engineer</option>
                            <option value="HR">HR</option>
                            <option value="Finance">Finance</option>
                            <option value="Sales">Sales</option>
                            <option value="__custom__">+ Create Custom Role</option>
                        </select>
                        {isCustomRole && (
                            <Input
                                placeholder="Enter custom role name"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                className="mt-2 h-9"
                                required
                            />
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                    <div className="text-center text-sm text-fg-secondary dark:text-gray-400">
                        Already have an account?{" "}
                        <Link to="/login" className="underline hover:text-fg dark:hover:text-white">Sign in</Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
};

export default Signup;
