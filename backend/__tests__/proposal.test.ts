import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/app";
import Proposal from "../src/models/Proposal";
import Vehicle from "../src/models/Vehicle";
import User from "../src/models/User";
import jwt from "jsonwebtoken";

describe("Suite de Testes: Fluxo de Negociação e Venda", () => {
  let tokenVendedor: string;
  let tokenComprador: string;
  let veiculoId: string;
  let propostaGanhadoraId: string;
  let comprador1Id: string;
  let comprador2Id: string;
  let vendedorId: string;
  let tokenComprador2: string;

  beforeAll(async () => {
    const vendedor = await User.create({
      name: "Vendedor AutoZoom",
      email: "vendedor@teste.com",
      cpf: "59398292955",
      phone: "11999999999",
      password: "Senha@123",
      birthDate: new Date("1990-01-01"),
    });

    const comprador1 = await User.create({
      name: "João Comprador",
      email: "joao@teste.com",
      cpf: "37458099984",
      phone: "11999999999",
      password: "Senha@123",
      birthDate: new Date("1990-01-01"),
    });
    comprador1Id = comprador1.id;
    vendedorId = vendedor.id;

    const comprador2 = await User.create({
      name: "Maria Perdedora",
      email: "maria@teste.com",
      cpf: "55199232991",
      phone: "11999999999",
      password: "Senha@123",
      birthDate: new Date("1990-01-01"),
    });

    comprador2Id = comprador2.id;

    const JWT_SECRET =
      process.env.JWT_SECRET || "SuaChaveSecretaSuperDificil123";

    tokenVendedor = jwt.sign({ id: vendedor.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    tokenComprador = jwt.sign({ id: comprador1.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    tokenComprador2 = jwt.sign({ id: comprador2.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const veiculo = await Vehicle.create({
      brand: "Volkswagen",
      model: "Gol",
      manufactureYear: 2020,
      modelYear: 2021,
      price: 50000,
      userId: vendedor.id,
      status: "available",
      location: "Campo Mourão - PR",
      engine: "1.0 MPI",
      transmission: "Manual",
      mileage: 45000,
      description: "Carro de teste impecável",
      features: ["Ar-condicionado", "Direção hidráulica"],
    });
    veiculoId = veiculo.id;

    const propostaGanhadora = await Proposal.create({
      targetVehicleId: veiculo.id,
      buyerId: comprador1.id,
      cashOffer: 48000,
      status: "PENDING",
    });
    propostaGanhadoraId = propostaGanhadora.id;

    await Proposal.create({
      targetVehicleId: veiculo.id,
      buyerId: comprador2.id,
      cashOffer: 45000,
      status: "PENDING",
    });
  });

  it("🟢 Deve iniciar a negociação de uma proposta pendente e liberar o contato", async () => {
    const response = await request(app)
      .patch(`/proposals/${propostaGanhadoraId}/status`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ status: "IN_NEGOTIATION" });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("Status atualizado");
    expect(response.body.contact.name).toBe("João Comprador");

    const proposal = await Proposal.findByPk(propostaGanhadoraId);
    expect(proposal?.status).toBe("IN_NEGOTIATION");
  });

  it("🔴 Deve bloquear alteração de status se não for o dono do carro", async () => {
    const response = await request(app)
      .patch(`/proposals/${propostaGanhadoraId}/status`)
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ status: "REJECTED" });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain("Acesso negado");
  });

  it("🔴 Deve bloquear proposta duplicada do mesmo comprador", async () => {
    const response = await request(app)
      .post("/proposals")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ targetVehicleId: veiculoId, cashOffer: 49000 });

    expect(response.status).toBe(409);
  });

  it("🔴 Deve bloquear proposta para o próprio veículo", async () => {
    const response = await request(app)
      .post("/proposals")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ targetVehicleId: veiculoId, cashOffer: 49000 });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("seu veículo");
  });

  it("🟢 Deve finalizar a venda, marcar carro como vendido e recusar outras propostas", async () => {
    const response = await request(app)
      .patch(`/vehicles/${veiculoId}/sell`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ buyerId: comprador1Id });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("Venda finalizada com sucesso");

    const soldVehicle = await Vehicle.findByPk(veiculoId);
    expect(soldVehicle?.status).toBe("sold");

    const winningProposal = await Proposal.findByPk(propostaGanhadoraId);
    expect(winningProposal?.status).toBe("ACCEPTED");

    const lostProposal = await Proposal.findOne({
      where: { targetVehicleId: veiculoId, buyerId: comprador2Id },
    });
    expect(lostProposal?.status).toBe("REJECTED");
  });

  it("🟢 Venda com troca deve recusar propostas pelo veículo dado na troca", async () => {
    const baseVehicle = {
      manufactureYear: 2018,
      modelYear: 2019,
      location: "Campo Mourão - PR",
      engine: "1.0",
      transmission: "Manual",
      mileage: 60000,
      description: "Veículo de teste",
      status: "available",
    };

    const onix = await Vehicle.create({
      ...baseVehicle,
      brand: "Chevrolet",
      model: "Onix",
      price: 60000,
      userId: vendedorId,
    });
    const uno = await Vehicle.create({
      ...baseVehicle,
      brand: "Fiat",
      model: "Uno",
      price: 25000,
      userId: comprador1Id,
    });

    const troca = await request(app)
      .post("/proposals")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ targetVehicleId: onix.id, offeredVehicleId: uno.id, cashOffer: 35000 });
    expect(troca.status).toBe(201);

    const propostaPeloUno = await request(app)
      .post("/proposals")
      .set("Authorization", `Bearer ${tokenComprador2}`)
      .send({ targetVehicleId: uno.id, cashOffer: 24000 });
    expect(propostaPeloUno.status).toBe(201);

    await request(app)
      .patch(`/proposals/${troca.body.proposal.id}/status`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ status: "IN_NEGOTIATION" })
      .expect(200);

    await request(app)
      .patch(`/vehicles/${onix.id}/sell`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ buyerId: comprador1Id })
      .expect(200);

    expect((await Vehicle.findByPk(uno.id))?.status).toBe("sold");
    expect(
      (await Proposal.findByPk(propostaPeloUno.body.proposal.id))?.status,
    ).toBe("REJECTED");
  });
});
