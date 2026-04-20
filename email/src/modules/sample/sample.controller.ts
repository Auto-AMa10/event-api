import { Request, Response } from "express";
import { SampleService } from "./sample.service.js";

export class SampleController {
  constructor(private sampleService: SampleService) {}

  getSamples = async (req: Request, res: Response) => {
    const result = await this.sampleService.getSamples();
    res.status(200).send(result);
  };

  getSample = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.sampleService.getSample(id);
    res.status(200).send(result);
  };
}
