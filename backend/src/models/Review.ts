import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";

import User from "./User";
import Proposal from "./Proposal";

@Table({
  tableName: "reviews",
  timestamps: true,

  indexes: [
    {
      name: "reviews_reviewer_proposal_unique",
      unique: true,
      fields: ["reviewerId", "proposalId"],
    },
  ],
})
export default class Review extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare rating: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare comment: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare reviewerId: string;

  @BelongsTo(() => User, "reviewerId")
  declare reviewer: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare reviewedId: string;

  @BelongsTo(() => User, "reviewedId")
  declare reviewed: User;

  @ForeignKey(() => Proposal)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare proposalId: string;

  @BelongsTo(() => Proposal, "proposalId")
  declare proposal: Proposal;
}
