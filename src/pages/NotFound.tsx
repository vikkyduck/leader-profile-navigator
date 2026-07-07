import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-primary/20 mb-4 tracking-tighter">404</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Страница не найдена</h1>
        <p className="text-muted-foreground mb-8">
          Такой страницы не существует. Возможно, ссылка устарела или содержит ошибку.
        </p>
        <Button asChild size="lg" className="rounded-xl">
          <a href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
