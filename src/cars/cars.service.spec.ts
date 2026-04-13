import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CarsService } from './cars.service';

// Simula a API encadeável usada pelo Drizzle nas consultas de leitura.
function createSelectChain<T>(result: T) {
  return {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    orderBy: jest.fn().mockResolvedValue(result),
    innerJoin: jest.fn().mockReturnThis(),
  };
}

// Simula insert(...).values(...).returning().
function createInsertChain<T>(result: T) {
  const returning = jest.fn().mockResolvedValue(result);
  const values = jest.fn().mockReturnValue({ returning });

  return {
    chain: { values },
    values,
    returning,
  };
}

// Simula update(...).set(...).where().
function createUpdateChain() {
  const where = jest.fn().mockResolvedValue(undefined);
  const set = jest.fn().mockReturnValue({ where });

  return {
    chain: { set },
    set,
    where,
  };
}

// Simula delete(...).where(...).returning().
function createDeleteChain<T>(result: T) {
  const returning = jest.fn().mockResolvedValue(result);
  const where = jest.fn().mockReturnValue({ returning });

  return {
    chain: { where },
    where,
    returning,
  };
}

describe('CarsService', () => {
  let service: CarsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    // O service é exercitado sem PostgreSQL real; toda a camada de banco é mockada.
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    service = new CarsService({ db } as unknown as DatabaseService);
  });

  it('retorna os dados do carro criado com o nome do usuário', async () => {
    const dto = { idUser: 1, plate: 'ABC1D23' };
    const hydratedCar = {
      idCar: 10,
      idUser: 1,
      plate: 'ABC1D23',
      userName: 'Maria',
    };

    db.select
      .mockReturnValueOnce(createSelectChain([{ idUser: 1 }]))
      .mockReturnValueOnce(createSelectChain([hydratedCar]));

    const insertQuery = createInsertChain([{ idCar: 10 }]);
    db.insert.mockReturnValue(insertQuery.chain);

    await expect(service.create(dto)).resolves.toEqual(hydratedCar);
  });

  it('envia os dados corretos ao inserir um carro', async () => {
    const dto = { idUser: 1, plate: 'ABC1D23' };
    const hydratedCar = {
      idCar: 10,
      idUser: 1,
      plate: 'ABC1D23',
      userName: 'Maria',
    };

    db.select
      .mockReturnValueOnce(createSelectChain([{ idUser: 1 }]))
      .mockReturnValueOnce(createSelectChain([hydratedCar]));

    const insertQuery = createInsertChain([{ idCar: 10 }]);
    db.insert.mockReturnValue(insertQuery.chain);

    await service.create(dto);

    expect(insertQuery.values).toHaveBeenCalledWith(dto);
  });

  it('impede a criação quando o usuário informado não existe', async () => {
    db.select.mockReturnValueOnce(createSelectChain([]));

    await expect(service.create({ idUser: 99, plate: 'ABC1D23' })).rejects.toMatchObject(
      {
        name: NotFoundException.name,
        message: 'Usuário 99 não encontrado.',
      },
    );
  });

  it('não tenta inserir o carro quando o usuário informado não existe', async () => {
    db.select.mockReturnValueOnce(createSelectChain([]));

    await expect(
      service.create({ idUser: 99, plate: 'ABC1D23' }),
    ).rejects.toMatchObject({
      name: NotFoundException.name,
      message: 'Usuário 99 não encontrado.',
    });

    expect(db.insert).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando o carro não existe', async () => {
    db.select.mockReturnValueOnce(createSelectChain([]));

    await expect(service.findOne(99)).rejects.toMatchObject({
      name: NotFoundException.name,
      message: 'Carro 99 não encontrado.',
    });
  });

  it('retorna o carro atualizado preservando o usuário atual quando idUser não é enviado', async () => {
    const existingCar = {
      idCar: 10,
      idUser: 1,
      plate: 'AAA1A11',
      userName: 'Maria',
    };
    const updatedCar = {
      idCar: 10,
      idUser: 1,
      plate: 'BBB2B22',
      userName: 'Maria',
    };

    db.select
      .mockReturnValueOnce(createSelectChain([existingCar]))
      .mockReturnValueOnce(createSelectChain([{ idUser: 1 }]))
      .mockReturnValueOnce(createSelectChain([updatedCar]));

    const updateQuery = createUpdateChain();
    db.update.mockReturnValue(updateQuery.chain);

    await expect(service.update(10, { plate: 'BBB2B22' })).resolves.toEqual(
      updatedCar,
    );
  });

  it('preserva o usuário atual ao enviar a atualização sem idUser', async () => {
    const existingCar = {
      idCar: 10,
      idUser: 1,
      plate: 'AAA1A11',
      userName: 'Maria',
    };
    const updatedCar = {
      idCar: 10,
      idUser: 1,
      plate: 'BBB2B22',
      userName: 'Maria',
    };

    db.select
      .mockReturnValueOnce(createSelectChain([existingCar]))
      .mockReturnValueOnce(createSelectChain([{ idUser: 1 }]))
      .mockReturnValueOnce(createSelectChain([updatedCar]));

    const updateQuery = createUpdateChain();
    db.update.mockReturnValue(updateQuery.chain);

    await service.update(10, { plate: 'BBB2B22' });

    expect(updateQuery.set).toHaveBeenCalledWith({
      idUser: 1,
      plate: 'BBB2B22',
    });
  });

  it('lança NotFoundException ao tentar remover um carro inexistente', async () => {
    const deleteQuery = createDeleteChain([]);
    db.delete.mockReturnValue(deleteQuery.chain);

    await expect(service.remove(50)).rejects.toMatchObject({
      name: NotFoundException.name,
      message: 'Carro 50 não encontrado.',
    });
  });
});
