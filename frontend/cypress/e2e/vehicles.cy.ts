/// <reference types="cypress" />

describe("CRUD de Veículos", () => {
  const veiculoTeste = {
    brand: "Volkswagen",
    model: `Nivus Teste ${Date.now()}`,
    manufactureYear: "2023",
    modelYear: "2024",
    price: "120000",
    priceEditado: "115000",
    mileage: "15000",
    engine: "1.0 TSI",
    transmission: "Automático",
    location: "Campo Mourão - PR",
    description: "Carro de teste para automação",
  };

  // login
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("alexandre_1782175037462@teste.com");
    cy.get('input[type="password"]').type("Senha123@");
    cy.get('button[type="submit"]').click();

    cy.url().should("not.include", "/login");
  });

  // Validação de Form
  it("Deve barrar o cadastro de veículo sem preencher os dados", () => {
    cy.visit("/anunciar");

    cy.get('button[type="submit"]').click();

    cy.url().should("include", "/anunciar");
  });

  // cadastro
  it("Deve realizar o ciclo completo: Cadastrar, Ler, Editar e Excluir", () => {
    cy.visit("/anunciar");
    cy.get('input[name="brand"]').type(veiculoTeste.brand);
    cy.get('input[name="model"]').type(veiculoTeste.model);
    cy.get('input[name="manufactureYear"]').type(veiculoTeste.manufactureYear);
    cy.get('input[name="modelYear"]').type(veiculoTeste.modelYear);
    cy.get('input[name="price"]').type(veiculoTeste.price);
    cy.get('input[name="mileage"]').type(veiculoTeste.mileage);
    cy.get('input[name="engine"]').type(veiculoTeste.engine);
    cy.get('select[name="transmission"]').type(veiculoTeste.transmission);
    cy.get('input[name="location"]').type(veiculoTeste.location);
    cy.get('textarea[name="description"]').type(veiculoTeste.description);

    cy.intercept("POST", "**/vehicles*").as("salvarVeiculo");

    cy.get('button[type="submit"]').click();

    cy.wait("@salvarVeiculo")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);

    // listar
    cy.visit("/");
    cy.contains(".vehicle-card-title", veiculoTeste.model).should("be.visible");

    // editar
    cy.contains(".vehicle-card-title", veiculoTeste.model).click();

    cy.contains(/editar/i).click();
    cy.url().should("include", "/editar-veiculo");
    cy.get('input[name="price"]').clear().type(veiculoTeste.priceEditado);

    cy.intercept("PUT", "**/vehicles/*").as("editarVeiculo");
    cy.intercept("GET", "**/vehicles/*").as("carregarVeiculo");

    cy.get('button[type="submit"]').click();

    cy.wait("@editarVeiculo")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);

    cy.wait("@carregarVeiculo");

    cy.contains(/editar/i).click();

    cy.contains(/excluir|apagar/i)
      .should("be.visible")
      .click();

    cy.visit("/");
    cy.contains(".vehicle-card-title", veiculoTeste.model).should("not.exist");
  });
});
