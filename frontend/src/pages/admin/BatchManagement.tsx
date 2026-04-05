import RoleLayout from "@/components/layouts/RoleLayout";
import { Layers, Construction } from "lucide-react";

const BatchManagement = () => {
  return (
    <RoleLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batch Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage batches</p>
        </div>

        <div className="glass-elevated rounded-2xl p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <Construction className="h-8 w-8 text-warning" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Batch management endpoints are not yet available in the backend. 
            This feature will allow you to create batches, assign students and teachers, 
            and organize tests by batch.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>Backend API required: batch CRUD routes</span>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};

export default BatchManagement;
