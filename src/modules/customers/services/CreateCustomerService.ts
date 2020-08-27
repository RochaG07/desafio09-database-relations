import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';
import { isNull } from 'util';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    // should not be able to create a customer with one e-mail thats already registered
    const repeatedEmail = await this.customersRepository.findByEmail(email);

    if(repeatedEmail) {
      throw new AppError('should not be able to create a customer with one e-mail thats already registered');
    }
  
    const customer = await this.customersRepository.create({name, email});

    return customer;
  }
}

export default CreateCustomerService;
