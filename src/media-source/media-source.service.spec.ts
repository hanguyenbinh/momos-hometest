import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceService } from './media-source.service';

describe('MediaSourceService', () => {
  let service: MediaSourceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaSourceService],
    }).compile();

    service = module.get<MediaSourceService>(MediaSourceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
