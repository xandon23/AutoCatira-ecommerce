import { DataTypes, Model, Op } from "sequelize";
import { sequelize } from "../config/database";
import { NotificationDraft, NotificationStatus } from "../domain/notification";

export class NotificationModel extends Model {
  declare id: string;
  declare eventId: string;
  declare event: string;
  declare userId: string;
  declare type: string;
  declare title: string;
  declare message: string;
  declare status: NotificationStatus;
  declare userName: string | null;
  declare attempts: number;
  declare readAt: Date | null;
  declare requestId: string | null;
  declare vehicleId: string | null;
  declare proposalId: string | null;
  declare vehicleTitle: string | null;
  declare createdAt: Date;
}

NotificationModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.STRING(64), allowNull: false },
    event: { type: DataTypes.STRING(64), allowNull: false },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    type: { type: DataTypes.STRING(64), allowNull: false },
    title: { type: DataTypes.STRING(150), allowNull: false },
    message: { type: DataTypes.STRING(500), allowNull: false },
    status: { type: DataTypes.ENUM("PENDENTE", "ENTREGUE", "DESCARTADA"), allowNull: false, defaultValue: "PENDENTE" },
    userName: { type: DataTypes.STRING(150), allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    readAt: { type: DataTypes.DATE, allowNull: true },
    requestId: { type: DataTypes.STRING(64), allowNull: true },
    vehicleId: { type: DataTypes.STRING(64), allowNull: true },
    proposalId: { type: DataTypes.STRING(64), allowNull: true },
    vehicleTitle: { type: DataTypes.STRING(150), allowNull: true },
  },
  {
    sequelize,
    tableName: "notifications",
    indexes: [
      { unique: true, fields: ["eventId", "userId", "type"] },
      { fields: ["userId", "status"] },
    ],
  },
);

export const notificationRepository = {
  async createIfAbsent(eventId: string, event: string, draft: NotificationDraft, requestId?: string) {
    const [notification, created] = await NotificationModel.findOrCreate({
      where: { eventId, userId: draft.userId, type: draft.type },
      defaults: { ...draft, eventId, event, requestId: requestId ?? null },
    });
    return { notification, created };
  },

  async updateStatus(id: string, status: NotificationStatus, userName?: string | null) {
    const n = await NotificationModel.findByPk(id);
    if (!n) return;
    await n.update({ status, userName: userName ?? n.userName, attempts: n.attempts + 1 });
  },

  findPending(limit = 50) {
    return NotificationModel.findAll({
      where: { status: "PENDENTE" },
      order: [["createdAt", "ASC"]],
      limit,
    });
  },

  findDeliveredByUser(userId: string) {
    return NotificationModel.findAll({
      where: { userId, status: "ENTREGUE" },
      order: [["createdAt", "DESC"]],
      limit: 100,
    });
  },

  async markAsRead(id: string, userId: string) {
    const [affected] = await NotificationModel.update(
      { readAt: new Date() },
      { where: { id, userId, readAt: { [Op.is]: null } } },
    );
    return affected > 0;
  },

  async countByStatus() {
    const rows = (await NotificationModel.findAll({
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "total"]],
      group: ["status"],
      raw: true,
    })) as unknown as { status: string; total: number }[];
    return Object.fromEntries(rows.map((r) => [r.status, Number(r.total)]));
  },
};
