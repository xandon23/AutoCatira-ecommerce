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

describe("CRUD de Usuários (Perfil)", () => {
  const usuarioTeste = {
    name: `Usuario ${Date.now()}`,
    nameEdited: `Usuario Editado ${Date.now()}`,
    email: `teste_${Date.now()}@teste.com`,
    phone: "11999999999",
    birthDate: "1990-01-01",
    password: "Senha123@",
    cpf: gerarCpfValido(),
  };

  it("Deve realizar o ciclo completo: Cadastrar, Ler, Editar e Excluir Conta", () => {
    // Cadastrar
    cy.visit("/register");

    cy.get('input[name="name"]').type(usuarioTeste.name);
    cy.get('input[name="email"]').type(usuarioTeste.email);
    cy.get('input[name="cpf"]').type(usuarioTeste.cpf);
    cy.get('input[name="phone"]').type(usuarioTeste.phone);
    cy.get('input[name="birthDate"]').type(usuarioTeste.birthDate);
    cy.get('input[name="password"]').type(usuarioTeste.password);
    cy.get('input[name="confirmPassword"]').type(usuarioTeste.password);
    cy.get('button[type="submit"]').click();

    cy.url().should("include", "/login");

    // Fazer Login e ver os dados no Perfil
    cy.get('input[type="email"]').type(usuarioTeste.email);
    cy.get('input[type="password"]').type(usuarioTeste.password);
    cy.get('button[type="submit"]').click();

    cy.url().should("not.include", "/login");

    cy.contains(usuarioTeste.name.split(" ")[0]).click();
    cy.url().should("include", "/perfil");

    // Valida se o nome cadastrado apareceu no perfil
    cy.contains(usuarioTeste.name).should("be.visible");

    // Editar o Nome)
    cy.intercept("PUT", "**/users/*").as("editarUsuario");

    cy.contains(/editar|editar perfil/i)
      .should("be.visible")
      .click();

    cy.get('input[placeholder="Nome"]').clear().type(usuarioTeste.nameEdited);

    cy.contains("Salvar").click();

    cy.wait("@editarUsuario")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);

    // Excluir Conta)
    cy.intercept("DELETE", "**/users/*").as("deletarUsuario");

    cy.contains(/editar|editar perfil/i)
      .should("be.visible")
      .click();

    cy.contains(/excluir conta/i)
      .should("be.visible")
      .click();

    cy.wait("@deletarUsuario")
      .its("response.statusCode")
      .should("be.oneOf", [200, 204]);

    cy.location("pathname").should("eq", "/");
  });
});
