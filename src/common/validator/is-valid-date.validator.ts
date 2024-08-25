import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as moment from 'moment';

export function IsValidDate(
  timeProperty: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidDate',
      target: object.constructor,
      propertyName,
      constraints: [timeProperty],
      options: validationOptions || {
        message: `${propertyName} must be formatted like YYYY-MM-DD`,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          return moment(value, ['YYYY-MM-DD'], true).isValid();
        },
      },
    });
  };
}
