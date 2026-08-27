"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { useNav } from "@/lib/nav-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, Star, Send, Trash2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  contentId: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

interface ReactionData {
  likes: number;
  dislikes: number;
  mine: "LIKE" | "DISLIKE" | null;
}

export function ReviewsSection({ contentId }: Props) {
  const { user } = useAuth();
  const { navigate } = useNav();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(8);
  const [comment, setComment] = useState("");

  // Reacciones
  const reactionQ = useQuery({
    queryKey: ["reaction", contentId],
    queryFn: () => api.get<ReactionData>(`/content/${contentId}/reaction`),
  });

  const reactionMut = useMutation({
    mutationFn: (type: "LIKE" | "DISLIKE") =>
      api.post(`/content/${contentId}/reaction`, { type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reaction", contentId] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // Reviews
  const reviewsQ = useQuery({
    queryKey: ["reviews", contentId],
    queryFn: () =>
      api.get<{ items: Review[]; stats: { total: number; average: number } }>(
        `/content/${contentId}/reviews`
      ),
  });

  const reviewMut = useMutation({
    mutationFn: () =>
      api.post(`/content/${contentId}/reviews`, { rating, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", contentId] });
      setShowReviewForm(false);
      setComment("");
      toast({ title: "Reseña publicada ✓" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteReviewMut = useMutation({
    mutationFn: () => api.delete(`/content/${contentId}/reviews`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", contentId] });
      toast({ title: "Reseña eliminada" });
    },
  });

  const reviews = reviewsQ.data?.items ?? [];
  const stats = reviewsQ.data?.stats ?? { total: 0, average: 0 };
  const likes = reactionQ.data?.likes ?? 0;
  const dislikes = reactionQ.data?.dislikes ?? 0;
  const mine = reactionQ.data?.mine ?? null;

  const handleReact = (type: "LIKE" | "DISLIKE") => {
    if (!user) {
      navigate("login");
      return;
    }
    reactionMut.mutate(type);
  };

  const submitReview = () => {
    if (!user) {
      navigate("login");
      return;
    }
    if (comment.trim().length < 3) {
      toast({
        title: "Muy corto",
        description: "Escribí al menos 3 caracteres",
        variant: "destructive",
      });
      return;
    }
    reviewMut.mutate();
  };

  return (
    <div className="mt-8">
      {/* Reacciones rápidas */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <Button
            variant={mine === "LIKE" ? "default" : "outline"}
            size="sm"
            onClick={() => handleReact("LIKE")}
            disabled={reactionMut.isPending}
            className={cn(
              "gap-1.5",
              mine === "LIKE" && "glow-red-sm"
            )}
          >
            <ThumbsUp className="h-4 w-4" />
            {likes}
          </Button>
          <Button
            variant={mine === "DISLIKE" ? "default" : "outline"}
            size="sm"
            onClick={() => handleReact("DISLIKE")}
            disabled={reactionMut.isPending}
            className={cn(
              "gap-1.5",
              mine === "DISLIKE" && "bg-muted-foreground text-background"
            )}
          >
            <ThumbsDown className="h-4 w-4" />
            {dislikes}
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold text-foreground">
            {stats.average > 0 ? stats.average.toFixed(1) : "—"}
          </span>
          <span>·</span>
          <span>{stats.total} reseña{stats.total !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Header reseñas */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <MessageSquare className="h-5 w-5 text-primary" />
          Reseñas de la comunidad
        </h2>
        {user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewForm((v) => !v)}
          >
            {showReviewForm ? "Cancelar" : "Escribir reseña"}
          </Button>
        )}
      </div>

      {/* Formulario de reseña */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 rounded-lg border border-border bg-card/40 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Tu calificación: <span className="font-bold text-primary">{rating}/10</span>
                </label>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i + 1)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded transition",
                        i < rating
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      )}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          i < rating && "fill-primary text-primary"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contá qué te pareció..."
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {comment.length}/500
                </span>
                <Button
                  onClick={submitReview}
                  disabled={reviewMut.isPending || comment.trim().length < 3}
                  size="sm"
                >
                  <Send className="mr-1.5 h-4 w-4" />
                  {reviewMut.isPending ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de reseñas */}
      <div className="mt-6 space-y-4">
        {reviewsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando reseñas...</p>
        ) : reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Todavía no hay reseñas. ¡Sé el primero en opinar!
            </p>
          </div>
        ) : (
          reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
              className="rounded-lg border border-border bg-card/40 p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 border border-border">
                  {r.user.avatar && <AvatarImage src={r.user.avatar} />}
                  <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                    {r.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {r.user.name}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={cn(
                              "h-3 w-3",
                              idx < Math.round(r.rating / 2)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {r.rating}/10
                        </span>
                      </div>
                    </div>
                    {r.user.id === user?.id && (
                      <button
                        onClick={() => deleteReviewMut.mutate()}
                        className="text-muted-foreground transition hover:text-destructive"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {r.comment && (
                    <p className="mt-1.5 text-sm text-foreground/80">
                      {r.comment}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
