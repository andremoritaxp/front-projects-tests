import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

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
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('This customer not exists!');
    }

    const productsExists = await this.productsRepository.findAllById(products);

    if (productsExists.length === 0) {
      throw new AppError('There are no products in this order!');
    }

    const productsExistIds = productsExists.map(product => product.id);

    const checkInexistentProductsIds = products
      .filter(product => !productsExistIds.includes(product.id));

    if (checkInexistentProductsIds.length) {
      throw new AppError(
        `Could not find product ${checkInexistentProductsIds[0].id}`
      );
    }

    const findProductsWithNoQuantityAvailable = products.filter(
      product =>
        productsExists.filter(
          prod => prod.id === product.id
        )[0].quantity <= product.quantity,
    );

    if (findProductsWithNoQuantityAvailable.length) {
      throw new AppError(
        `The quantity ${findProductsWithNoQuantityAvailable[0].quantity} is not available`
      );
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsExists.filter(prod => prod.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProducts,
    });

    const orderedProductQuantity = products.map(product => ({
      id: product.id,
      quantity:
        productsExists.filter(prod => prod.id === product.id)[0].quantity - product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductQuantity);

    return order;
  }
}

export default CreateOrderService;
