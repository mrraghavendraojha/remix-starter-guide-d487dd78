import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface AuthPageProps {
  onBack: () => void;
  onLogin: () => void;
}

// Validation schemas
const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password must be less than 72 characters"),
  confirmPassword: z.string(),
  block: z.string().trim().min(1, "Block is required").max(10, "Block must be less than 10 characters"),
  roomNumber: z.string().trim().min(1, "Room number is required").max(10, "Room number must be less than 10 characters"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  hostelName: z.string().trim().min(2, "Hostel/Society name is required").max(100, "Name must be less than 100 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const AuthPage = ({ onBack, onLogin }: AuthPageProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    block: "",
    roomNumber: "",
    phone: "",
    hostelName: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onLogin();
      }
    };
    checkUser();
  }, [onLogin]);

  const validateField = (schema: z.ZodSchema, data: any, field: string) => {
    try {
      schema.parse(data);
      setErrors(prev => ({ ...prev, [field]: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path.includes(field));
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
          return false;
        }
      }
      return true;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const result = signupSchema.safeParse(signupData);
      if (!result.success) {
        const formErrors: Record<string, string> = {};
        result.error.errors.forEach((error) => {
          if (error.path.length > 0) {
            formErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(formErrors);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: signupData.name,
            block: signupData.block,
            room_number: signupData.roomNumber,
            phone: signupData.phone,
            hostel_name: signupData.hostelName
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setErrors({ email: "An account with this email already exists" });
        } else {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to confirm your account before logging in.",
        variant: "default"
      });

      // Switch to login tab
      setActiveTab("login");
      setLoginData({ email: signupData.email, password: "" });
      
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const result = loginSchema.safeParse(loginData);
      if (!result.success) {
        const formErrors: Record<string, string> = {};
        result.error.errors.forEach((error) => {
          if (error.path.length > 0) {
            formErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(formErrors);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrors({ 
            email: "Invalid email or password",
            password: "Invalid email or password" 
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email Not Confirmed",
            description: "Please check your email and click the confirmation link before logging in.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Welcome Back!",
        description: "You have successfully logged in.",
        variant: "default"
      });

      onLogin();
      
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-accent rounded-full shadow-soft">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">Join your community today</p>
          </div>
        </div>

        <Card className="shadow-hover border-2 backdrop-blur-sm bg-glass-gradient animate-scale-in">
          <CardHeader className="pb-6 space-y-1">
            <CardTitle className="text-center text-2xl">Join Your Community</CardTitle>
            <p className="text-center text-muted-foreground text-sm">Connect with your neighbors</p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-card transition-smooth rounded-lg">Login</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-card transition-smooth rounded-lg">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">Email</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => {
                        setLoginData(prev => ({ ...prev, email: e.target.value }));
                        validateField(loginSchema, { ...loginData, email: e.target.value }, "email");
                      }}
                      className={errors.email ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loginPassword">Password</Label>
                    <div className="relative">
                      <Input
                        id="loginPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => {
                          setLoginData(prev => ({ ...prev, password: e.target.value }));
                          validateField(loginSchema, { ...loginData, password: e.target.value }, "password");
                        }}
                        className={errors.password ? "border-destructive pr-10" : "pr-10"}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="community"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signupName">Full Name *</Label>
                    <Input
                      id="signupName"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupData.name}
                      onChange={(e) => {
                        setSignupData(prev => ({ ...prev, name: e.target.value }));
                        validateField(signupSchema, { ...signupData, name: e.target.value }, "name");
                      }}
                      className={errors.name ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.name && errors.name.trim() !== "" && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">Email *</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => {
                        setSignupData(prev => ({ ...prev, email: e.target.value }));
                        validateField(signupSchema, { ...signupData, email: e.target.value }, "email");
                      }}
                      className={errors.email ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.email && errors.email.trim() !== "" && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signupBlock">Block *</Label>
                      <Input
                        id="signupBlock"
                        type="text"
                        placeholder="e.g., A, B, C"
                        value={signupData.block}
                        onChange={(e) => {
                          setSignupData(prev => ({ ...prev, block: e.target.value }));
                          validateField(signupSchema, { ...signupData, block: e.target.value }, "block");
                        }}
                        className={errors.block ? "border-destructive" : ""}
                        disabled={isLoading}
                      />
                      {errors.block && errors.block.trim() !== "" && <p className="text-sm text-destructive">{errors.block}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupRoom">Room Number *</Label>
                      <Input
                        id="signupRoom"
                        type="text"
                        placeholder="e.g., 204"
                        value={signupData.roomNumber}
                        onChange={(e) => {
                          setSignupData(prev => ({ ...prev, roomNumber: e.target.value }));
                          validateField(signupSchema, { ...signupData, roomNumber: e.target.value }, "roomNumber");
                        }}
                        className={errors.roomNumber ? "border-destructive" : ""}
                        disabled={isLoading}
                      />
                      {errors.roomNumber && errors.roomNumber.trim() !== "" && <p className="text-sm text-destructive">{errors.roomNumber}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPhone">Phone Number *</Label>
                    <Input
                      id="signupPhone"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={signupData.phone}
                      onChange={(e) => {
                        setSignupData(prev => ({ ...prev, phone: e.target.value }));
                        validateField(signupSchema, { ...signupData, phone: e.target.value }, "phone");
                      }}
                      className={errors.phone ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.phone && errors.phone.trim() !== "" && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupHostelName">Hostel/Society Name *</Label>
                    <Input
                      id="signupHostelName"
                      type="text"
                      placeholder="Enter your hostel or society name"
                      value={signupData.hostelName}
                      onChange={(e) => {
                        setSignupData(prev => ({ ...prev, hostelName: e.target.value }));
                        validateField(signupSchema, { ...signupData, hostelName: e.target.value }, "hostelName");
                      }}
                      className={errors.hostelName ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.hostelName && errors.hostelName.trim() !== "" && <p className="text-sm text-destructive">{errors.hostelName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Password *</Label>
                    <div className="relative">
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 characters)"
                        value={signupData.password}
                        onChange={(e) => {
                          setSignupData(prev => ({ ...prev, password: e.target.value }));
                          validateField(signupSchema, { ...signupData, password: e.target.value }, "password");
                        }}
                        className={errors.password ? "border-destructive pr-10" : "pr-10"}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && errors.password.trim() !== "" && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupConfirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="signupConfirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signupData.confirmPassword}
                        onChange={(e) => {
                          setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }));
                          validateField(signupSchema, { ...signupData, confirmPassword: e.target.value }, "confirmPassword");
                        }}
                        className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && errors.confirmPassword.trim() !== "" && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="community"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};