import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

export const AuthControllerTest = () =>
  describe('AuthController', () => {
    let module: TestingModule;
    let controller: AuthController;
    let service: AuthService;
    const mockedAuthService = {
      register: jest.fn().mockResolvedValue({}),
      login: jest.fn().mockResolvedValue({}),
    };

    beforeAll(async () => {
      module = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: mockedAuthService,
          },
        ],
      }).compile();

      controller = module.get<AuthController>(AuthController);
      service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
    describe('POST register API', () => {
      it('register', async () => {        
      });
    });

    describe('POST login API', () => {
      it('login', async () => {
        await controller.login({} as any);
        expect(service.login).toBeCalledTimes(1);
      });
    });

    afterAll(async () => {
      Logger.log('finished auth.controller.spec.ts');
      await module.close();
    });
  });
