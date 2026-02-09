"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletGate } from "@/components/wallet-gate";
import { PageTransition } from "@/components/motion";
import { BatchDashboard } from "@/components/admin/batch-dashboard";
import { CreateBatchForm } from "@/components/admin/create-batch-form";
import { AdvanceStateForm } from "@/components/admin/advance-state-form";
import { RoleManagement } from "@/components/admin/role-management";
import { ContractControl } from "@/components/admin/contract-control";

export function AdminPanel() {
  return (
    <PageTransition>
    <WalletGate>
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="create">📝 Crear Lote</TabsTrigger>
          <TabsTrigger value="advance">⏭️ Avanzar Estado</TabsTrigger>
          <TabsTrigger value="roles">👥 Roles</TabsTrigger>
          <TabsTrigger value="control">⚙️ Contrato</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <BatchDashboard />
        </TabsContent>

        <TabsContent value="create">
          <CreateBatchForm />
        </TabsContent>

        <TabsContent value="advance">
          <AdvanceStateForm />
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="control">
          <ContractControl />
        </TabsContent>
      </Tabs>
    </WalletGate>
    </PageTransition>
  );
}
