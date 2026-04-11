export default function SimpleToast({ open, message, type = "success" }) {
  if (!open) return null;

  return <div className={`simple-toast ${type}`}>{message}</div>;
}