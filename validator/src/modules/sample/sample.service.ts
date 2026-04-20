import { PrismaClient } from "../../../../src/generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";

export class SampleService {
  constructor(private prisma: PrismaClient) {}

  getSamples = async () => {
    return [];
  };

  getSample = async (id: number) => {
    return { id, name: "Sample Data" };
  };
}
