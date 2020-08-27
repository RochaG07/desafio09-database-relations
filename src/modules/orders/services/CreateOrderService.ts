import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IOrdersRepository from '../repositories/IOrdersRepository';

import Order from '../infra/typeorm/entities/Order';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    // should not be able to create an order with a invalid customer
    if (!customer) {
      throw new AppError('could not create an order with a invalid customer');
    }

    const productsInStock = await this.productsRepository.findAllById(products);

    // should not be able to create an order with invalid products
    if(!productsInStock.length) {
      throw new AppError('could not create an order with invalid products');
    }

    const productsInStockIds = productsInStock.map(product => product.id);

    const checkInexistentProducts = products.filter(
      product => !productsInStockIds.includes(product.id)
    );
    
    if(checkInexistentProducts.length) {
      throw new AppError('could not find product '+ checkInexistentProducts[0].id);
    }

    console.log("CHEGOU ATÉ AQUI 1");
   
    // should not be able to create an order with products with insufficient quantities
    
    const findProductsWithNoQuantityAvailable = products.filter(
      product => 
        productsInStock.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );
    console.log("CHEGOU ATÉ AQUI 2");

    if(findProductsWithNoQuantityAvailable.length) {
      throw new AppError('could not create an order with products with insufficient quantities');
    }
    
    console.log("CHEGOU ATÉ AQUI 3");

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      price: productsInStock.filter(p => p.id === product.id)[0].price,
      quantity: product.quantity,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProducts
    });

    // Desconta na quantidade produtos em stock os produtos comprados  
    const { order_products } = order;

    const orderedProductsQuantity = order_products.map( product => ({
      id: product.product_id,
      quantity: 
        productsInStock.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
