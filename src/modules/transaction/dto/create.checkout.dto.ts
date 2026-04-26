import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateCheckoutDTO {
  @Transform(({ value }) => Number(value))
  @IsInt()
  eventId!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  qty!: number;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsUsed?: number;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  voucherCode?: string;
}