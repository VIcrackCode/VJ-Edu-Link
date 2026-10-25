import { useEffect, useState } from "react";
import { api } from "../services/apiClient";

export function useContent(contentType) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api(`/content/${contentType}`)
      .then(({ items: nextItems }) => {
        if (!cancelled) {
          setItems(nextItems);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contentType]);

  return { items, error, loading };
}
