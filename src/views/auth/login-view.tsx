"use client";
import { useEffect, useState } from "react";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { Content } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound, Mail, Lock, User as UserIcon, ArrowLeft, Crown } from "lucide-react";

export function LoginView() {
  const { navigate, back } = useNav();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // token
  const [token, setToken] = useState("");

  const loginEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await api.post("/auth/login", { email, password });
      setUser(res.user);
      toast({ title: `¡Bienvenido, ${res.user.name}! 🎬` });
      navigate("browse");
    } catch (err: any) {
      toast({ title: "Error al iniciar sesión", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loginToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await api.post("/auth/token", { token: token.trim().toUpperCase() });
      setUser(res.user);
      toast({ title: `¡Bienvenido, ${res.user.name}! 🎬` });
      navigate("browse");
    } catch (err: any) {
      toast({ title: "Token inválido", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10">
      {/* Fondo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-black" />
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-red-900/30 blur-[120px]" />
      </div>

      <button
        onClick={back}
        className="absolute left-4 top-20 flex items-center gap-1 text-sm text-muted-foreground hover:text-white sm:left-8"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <Card className="relative z-10 w-full max-w-md border-border/60 bg-card/90 backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto">
            <span className="text-3xl font-black tracking-tighter">
              <span className="text-primary">JOSE</span>
              <span className="text-white">DEMO</span>
            </span>
          </div>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">
                <Mail className="mr-1.5 h-4 w-4" /> Email
              </TabsTrigger>
              <TabsTrigger value="token">
                <KeyRound className="mr-1.5 h-4 w-4" /> Token
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-4">
              <form onSubmit={loginEmail} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cargando..." : "Ingresar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="token" className="mt-4">
              <form onSubmit={loginToken} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="token">Token de acceso</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="token"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="JD-XXXX-XXXX-XXXX"
                      className="pl-9 font-mono uppercase tracking-wider"
                      style={{ textTransform: "uppercase" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ingresá tu token de acceso simple para entrar sin email ni contraseña.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verificando..." : "Acceder con token"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-3 border-t border-border pt-4">
            <p className="text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <button
                onClick={() => navigate("register")}
                className="font-semibold text-primary hover:underline"
              >
                Registrate gratis
              </button>
            </p>
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <Crown className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Demo:</span> demo@josedemo.com / demo123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
