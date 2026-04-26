import { Type } from "class-transformer";
import {
  IsInt,
  IsNumber,
  IsString,
  ValidateNested,
  IsArray,
  IsOptional,
} from "class-validator";

class RevenueChartDTO {
  @IsString()
  name!: string;

  @IsNumber()
  revenue!: number;
}

export class DashboardDTO {
  @IsNumber()
  totalRevenue!: number;

  @IsInt()
  activeEvents!: number;

  @IsInt()
  pendingTransactions!: number;

  @IsInt()
  ticketsToday!: number;

  @IsOptional()
  @IsInt()
  pageViews?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevenueChartDTO)
  revenueChart!: RevenueChartDTO[];
}