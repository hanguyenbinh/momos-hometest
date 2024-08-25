import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'src/config/configuration';
import { Company } from 'src/entities/company.entity';
import { User } from 'src/entities/user.entity';
import { Connection } from 'typeorm';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';

export const AuthServiceTest = () =>
  describe('AuthService', () => {
    let module: TestingModule;
    let service: AuthService;
    const mockConnection = () => ({
      transaction: jest.fn(),
    });
    const company = {
      firstName: 'join',
      lastName: 'smith',
      email: 'vi.lh@gmail.com',
      password: '123123',
      facebook: 'string',
      instagram: 'string',
      youtube: 'string',
      openTime: '00:01:41',
      closeTime: '00:01:41',
      companyLanguages: [
        {
          alias: 'en-US',
          name: 'Kungfu branch',
          description: 'These are many best food',
          address: '291 hongkong',
          about: 'This is our about message',
          terms: 'Term and privacy',
          privacy: 'privacy',
          hotline: '5567234',
        },
      ],
    };

    beforeAll(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            cache: false,
            load: [configuration],
          }),
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
              return configService.get('database');
            },
          }),
          TypeOrmModule.forFeature([Company, User]),
          PassportModule,
          JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
              return configService.get('jwt');
            },
          }),
        ],
        providers: [
          JwtStrategy,
          AuthService,
          Logger,
          {
            provide: Connection,
            useFactory: mockConnection,
          },
        ],
      }).compile();
      service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('register API', () => {
      it('should return new company with admin user', async () => {
        const result = await service.register(company as any);
        const expectedResult = {
          id: 1,
          email: 'vi.lh@gmail.com',
          facebook: 'string',
          instagram: 'string',
          youtube: 'string',
          openTime: '00:01:41',
          closeTime: '00:01:41',
          companyLanguages: [
            {
              alias: 'en-US',
              name: 'Kungfu branch',
              description: 'These are many best food',
              address: '291 hongkong',
              about: 'This is our about message',
              terms: 'Term and privacy',
              privacy: 'privacy',
              hotline: '5567234',
            },
          ],
        };
        expect(result).toMatchObject({
          status: true,
          message: 'REGISTER_SUCCESS',
          data: expectedResult,
        });
      });
    });
    describe('login', () => {
      it('should return accessToken and tenancyId', async () => {
        const result = await service.login({
          email: 'vi.lh@gmail.com',
          password: '123123',
        });
        expect(result).toHaveProperty('status', true);
        expect(result).toHaveProperty('data.accessToken');
        expect(result).toHaveProperty('data.tenancyId');
      });
    });

    describe('login fail', () => {
      it('should return USER_NOT_FOUND message', async () => {
        const result = await service.login({
          email: 'Jaqueline_Kautzer123@yahoo.com',
          password: '123123',
        });
        expect(result).toEqual({
          status: false,
          message: 'USER_NOT_FOUND',
        });
      });
    });
    afterAll(async () => {
      Logger.log('abcd');
      await module.close();
    });
  });
