import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceController } from './media-source.controller';

describe('MediaSourceController', () => {
  let controller: MediaSourceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaSourceController],
    }).compile();

    controller = module.get<MediaSourceController>(MediaSourceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
