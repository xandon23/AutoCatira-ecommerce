/// <reference types="cypress" />
export {};
const gerarCpfValido = () => {
  const aleatorio = () => Math.floor(Math.random() * 9);
  const n = [
    aleatorio(),
    aleatorio(),
    aleatorio(),
    aleatorio(),
    aleatorio(),
    aleatorio(),
    aleatorio(),
    aleatorio(),
    aleatorio(),
  ];

  let d1 = 0;
  for (let i = 0; i < 9; i++) d1 += n[i] * (10 - i);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;

  let d2 = 0;
  for (let i = 0; i < 9; i++) d2 += n[i] * (11 - i);
  d2 += d1 * 2;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;

  return `${n.join("")}${d1}${d2}`;
};

describe("Autenticação: Cadastro e Login", () => {
  const usuarioTeste = {
    nome: "Alexandre Teste",
    email: `alexandre_${Date.now()}@teste.com`,
    phone: "11999999999",
    birthDate: "1990-01-01",
    cpf: gerarCpfValido(),
    password: "Senha123@",
  };

  // ==========================================
  // CENÁRIOS DE CRIAÇÃO DE USUÁRIO
  // ==========================================
  it("Deve falhar ao tentar cadastrar usuário sem preencher a senha", () => {
    cy.visit("/register");

    cy.get('input[name="name"]').type(usuarioTeste.nome);
    cy.get('input[name="email"]').type(usuarioTeste.email);
    cy.get('input[name="phone"]').type(usuarioTeste.phone);
    cy.get('input[name="birthDate"]').type(usuarioTeste.birthDate);
    cy.get('input[name="cpf"]').type(usuarioTeste.cpf);
    cy.get('button[type="submit"]').click();

    cy.get('input[type="password"]')
      .invoke("prop", "validationMessage")
      .should("not.be.empty");
    cy.url().should("include", "/register");
  });

  it("Deve cadastrar um novo usuário com sucesso", () => {
    cy.visit("/register");

    cy.get('input[name="name"]').type(usuarioTeste.nome);
    cy.get('input[name="email"]').type(usuarioTeste.email);
    cy.get('input[name="phone"]').type(usuarioTeste.phone);
    cy.get('input[name="birthDate"]').type(usuarioTeste.birthDate);
    cy.get('input[name="cpf"]').type(usuarioTeste.cpf);
    cy.get('input[name="password"]').type(usuarioTeste.password);
    cy.get('input[name="confirmPassword"]').type(usuarioTeste.password);
    cy.get('button[type="submit"]').click();

    cy.url().should("include", "/login");
  });

  // ==========================================
  // CENÁRIOS DE LOGIN
  // ==========================================
  it("Deve falhar ao tentar fazer login com senha incorreta", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').type(usuarioTeste.email);
    cy.get('input[type="password"]').type("senha_errada_123");
    cy.intercept("POST", "**/auth/login").as("loginFalho");
    cy.get('button[type="submit"]').click();
    cy.wait("@loginFalho").its("response.statusCode").should("eq", 401);
  });

  it("Deve fazer login com sucesso e entrar no sistema", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').type(usuarioTeste.email);
    cy.get('input[type="password"]').type(usuarioTeste.password);
    cy.get('button[type="submit"]').click();

    cy.url().should("not.include", "/profile");

    cy.get(".navbar-user-btn").click();

    cy.contains("Sair").should("be.visible");
  });
});
