import { Test, TestingModule } from '@nestjs/testing';
import { SummarizeController } from './summary.controller';
import { SummarizeService } from './summarize.service';

describe('SummarizeController', () => {
  let controller: SummarizeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummarizeController],
      providers: [
        {
          provide: SummarizeService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<SummarizeController>(SummarizeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
