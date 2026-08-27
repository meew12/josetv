"use client";
import { useState } from "react";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User as UserIcon, KeyRound, CheckCircle2 } from "lucide-react";

export function RegisterView() {
  const { navigate, back } = useNav();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [adult, setAdult] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.post("/auth/register", {
        name,
        email,
        password,
        adultVerified: adult,
      });
      setUser(res.user);
      toast({ title: "¡Cuenta creada! 🎉", description: `Tu token: ${res.user.token}` });
      navigate("browse");
    } catch (err: any) {
      toast({ title: "Error al registrar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-black" />
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
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
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="pl-9"
                />
              </div>
            </div>
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
                  placeholder="Mínimo 6 caracteres"
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

            <label
              htmlFor="adult"
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-muted/30 p-3"
            >
              <Checkbox
                id="adult"
                checked={adult}
                onCheckedChange={(v) => setAdult(v === true)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground">
                Tengo 18 años o más y desbloquear el contenido para adultos (+18)
              </span>
            </label>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando..." : "Registrarme"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 border-t border-border pt-4">
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <button
                onClick={() => navigate("login")}
                className="font-semibold text-primary hover:underline"
              >
                Iniciá sesión
              </button>
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Al registrarte recibís un <strong className="text-foreground">token de acceso</strong> para entrar sin contraseña cuando quieras.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
