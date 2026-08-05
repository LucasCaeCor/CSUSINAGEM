📘 Documentação Técnica – CSUSINAGEM-Frontend
📌 Visão Geral
O CSUSINAGEM-Frontend é uma aplicação web desenvolvida com React e TypeScript, destinada ao gerenciamento de categorias e itens associados, incluindo funcionalidades de autenticação, listagem, criação e manipulação de itens.

🛠️ Tecnologias Utilizadas
React: Biblioteca principal para construção da interface de usuário.

TypeScript: Superset do JavaScript que adiciona tipagem estática.

React Router DOM: Gerenciamento de rotas no frontend.

CSS Modules: Estilização modular dos componentes.

Fetch API: Comunicação com o backend via requisições HTTP.

📁 Estrutura de Pastas
plaintext
Copiar
Editar
src/
├── components/       # Componentes reutilizáveis (e.g., Sidebar)
├── pages/            # Páginas principais da aplicação (e.g., Login, Dashboard)
├── services/         # Serviços para comunicação com APIs
├── App.tsx           # Componente principal com definição de rotas
├── index.tsx         # Ponto de entrada da aplicação
🔐 Autenticação
A autenticação é baseada em tokens JWT armazenados no localStorage.

Rotas protegidas verificam a presença do token para conceder acesso.

Após logout, o token é removido, e o usuário é redirecionado para a página de login.

🧭 Gerenciamento de Rotas
As rotas são definidas no App.tsx utilizando o React Router DOM.

tsx
Copiar
Editar
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
  <Route path="/customers" element={isLoggedIn ? <CustomersList /> : <Navigate to="/login" />} />
  <Route path="/category/:id" element={isLoggedIn ? <CategoryPage /> : <Navigate to="/login" />} />
  <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
</Routes>


🖼️ Componentes Principais
Sidebar
Componente de navegação lateral presente em páginas autenticadas.

CategoryPage
Página que exibe os itens de uma categoria específica, permitindo:

Listagem de itens.

Expansão de detalhes do item.

Criação de novos itens via modal.

Modal
Componente reutilizável para exibição de formulários ou informações adicionais.

🎨 Estilização
A estilização é realizada utilizando CSS Modules, permitindo escopo local para os estilos e evitando conflitos.

🐞 Possíveis Melhorias
Implementar tratamento de erros mais robusto nas requisições.

Adicionar testes unitários e de integração.

Melhorar a responsividade da aplicação.