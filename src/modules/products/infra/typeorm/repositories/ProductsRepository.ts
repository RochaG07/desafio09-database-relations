import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity
    })

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    /*const productsById:Product[] = [] 
    
    products.forEach(async product => {
      const productById = await this.ormRepository.findOne(product.id);

      if(productById){
        productsById.push(productById);
      }
    });

    return productsById;*/

    const productsIds = products.map(product => product.id);

    const existentProducts = await this.ormRepository.find({
      where: {
        id: In(productsIds),
      },
    });

    return existentProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    /*const productsWithUpdatedQuantity: Product[] = [];
    
    products.forEach(async product => {
      await this.ormRepository
      .createQueryBuilder()
      .update(Product)
      .set({ quantity: product.quantity})
      .where("id = :id", {id: product.id})
      .execute();

      const updatedProd = await this.ormRepository.findOne(product.id);

      if(updatedProd){
        productsWithUpdatedQuantity.push(updatedProd);
      }
    });

    return productsWithUpdatedQuantity;*/

    return this.ormRepository.save(products);
  }
}

export default ProductsRepository;
