import { PricingTable } from "@clerk/nextjs";

export default function Subscription() {
  return (
    <main className="flex items-center justify-center p-4 max-w-7xl mx-auto">
      <PricingTable />
    </main>
  );
}
