import { useEffect, useState } from 'react';

type Customer = {
  id: string;
  name: string;
  email: string;
};

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetch('/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => console.error('Erro ao buscar clientes:', err));
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    const newCustomer = await res.json();
    setCustomers(prev => [...prev, newCustomer]);
    setName('');
    setEmail('');
  };

const handleDelete = async (id: string) => {
  const res = await fetch(`/customer/${id}`, {
    method: 'DELETE'
  });

  if (res.ok) {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }
};

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Clientes</h1>
      <ul>
        {customers.map(c => (
          <li key={c.id}>
            {c.name} ({c.email})
            <button onClick={() => handleDelete(c.id)} style={{ marginLeft: '1rem' }}>
              Deletar
            </button>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: '2rem' }}>Adicionar Cliente</h2>
      <input
        placeholder="Nome"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginRight: '1rem' }}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ marginRight: '1rem' }}
      />
      <button onClick={handleCreate}>Criar</button>
    </div>
  );
}

export default App;
