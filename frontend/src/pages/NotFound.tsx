import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <GraduationCap className="h-20 w-20 text-muted-foreground/30 mb-8" />
      <div className="text-center max-w-md">
        <h1 className="mb-2 text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page not found</h2>
        <p className="mb-8 text-muted-foreground">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <Button asChild className="h-11 px-8 rounded-full">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
