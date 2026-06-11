export function AdminInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input className="mt-1 w-full rounded-lg border border-black/10 p-3 font-normal" {...props} />
    </label>
  );
}
