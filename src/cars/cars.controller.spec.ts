import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';

describe('CarsController', () => {
  let controller: CarsController;
  let carsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    // Aqui o interesse é validar delegação, não regra de negócio do service.
    carsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new CarsController(carsService as unknown as CarsService);
  });

  it('delega a criação ao service', async () => {
    const dto = { idUser: 1, plate: 'ABC1D23' };
    const response = { idCar: 1, ...dto, userName: 'Maria' };
    carsService.create.mockResolvedValue(response);

    await controller.create(dto);
    expect(carsService.create).toHaveBeenCalledWith(dto);
  });

  it('delega a listagem ao service', async () => {
    const response = [{ idCar: 1, idUser: 1, plate: 'ABC1D23', userName: 'Maria' }];
    carsService.findAll.mockResolvedValue(response);

    await controller.findAll();
    expect(carsService.findAll).toHaveBeenCalled();
  });

  it('delega a busca por id ao service', async () => {
    const response = { idCar: 1, idUser: 1, plate: 'ABC1D23', userName: 'Maria' };
    carsService.findOne.mockResolvedValue(response);

    await controller.findOne(1);
    expect(carsService.findOne).toHaveBeenCalledWith(1);
  });

  it('delega a atualização ao service', async () => {
    const dto = { plate: 'BBB2B22' };
    const response = { idCar: 1, idUser: 1, plate: 'BBB2B22', userName: 'Maria' };
    carsService.update.mockResolvedValue(response);

    await controller.update(1, dto);
    expect(carsService.update).toHaveBeenCalledWith(1, dto);
  });

  it('delega a remoção ao service', async () => {
    const response = { message: 'Carro removido com sucesso.' };
    carsService.remove.mockResolvedValue(response);

    await controller.remove(1);
    expect(carsService.remove).toHaveBeenCalledWith(1);
  });
});
