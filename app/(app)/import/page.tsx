import ImportForm from "./ImportForm";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Import bank transactions</h1>
      <ImportForm />
    </div>
  );
}
