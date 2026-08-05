const API_URL = import.meta.env.VITE_BACKEND_URL;

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function fetchCustomers() {
  const res = await fetch(`${API_URL}/customers`);
  return res.json();
}
