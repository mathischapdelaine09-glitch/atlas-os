export function saveData(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function loadData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;

  const data = localStorage.getItem(key);

  if (!data) return defaultValue;

  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}