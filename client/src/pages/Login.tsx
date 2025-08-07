import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/authUtils";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

// Demo accounts for each role
const demoAccounts = {
  user: { username: "user", password: "admin123", label: "Regular User" },
  group_director: { username: "director", password: "admin123", label: "Group Director" },
  secretary: { username: "secretary", password: "admin123", label: "Secretary" },
  it_team: { username: "itadmin", password: "admin123", label: "IT Admin" },
};

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Handle role selection and auto-fill credentials
  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    if (role && demoAccounts[role as keyof typeof demoAccounts]) {
      const account = demoAccounts[role as keyof typeof demoAccounts];
      setValue("username", account.username);
      setValue("password", account.password);
      setValue("role", role);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();
      
      if (result.token) {
        setAuthToken(result.token);
      }
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      // Redirect based on role
      const role = result.user.role;
      if (role === 'group_director') {
        window.location.href = "/director";
      } else if (role === 'secretary') {
        window.location.href = "/secretary";
      } else if (role === 'it_team') {
        window.location.href = "/it";
      } else {
        window.location.href = "/user";
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 drdo-active rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your DRDO Booking System account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Quick Login (Demo Accounts)</Label>
              <Select onValueChange={handleRoleSelect} value={selectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to auto-fill credentials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">👤 Regular User</SelectItem>
                  <SelectItem value="group_director">👨‍💼 Group Director</SelectItem>
                  <SelectItem value="secretary">📋 Secretary</SelectItem>
                  <SelectItem value="it_team">💻 IT Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="Enter your username"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full drdo-active hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Available demo accounts:</p>
            <div className="text-xs space-y-1">
              <p><strong>👤 User:</strong> user / admin123</p>
              <p><strong>👨‍💼 Director:</strong> director / admin123</p>
              <p><strong>📋 Secretary:</strong> secretary / admin123</p>
              <p><strong>💻 IT Admin:</strong> itadmin / admin123</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Use the dropdown above to auto-fill credentials
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
