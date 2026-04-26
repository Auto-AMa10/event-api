import { IsNumber, IsString } from "class-validator";

class RevenueChartDTO {
  @IsString()
  name!: string;

  @IsNumber()
  revenue!: number;
}