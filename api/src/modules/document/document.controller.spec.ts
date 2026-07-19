import { DocumentController } from './document.controller';

describe('DocumentController', () => {
  const service = { process: jest.fn() };
  let controller: DocumentController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DocumentController(service as never);
  });

  it('delegates text processing', async () => {
    await controller.process({ text: 'cours' }, undefined);
    expect(service.process).toHaveBeenCalledWith('cours', undefined);
  });

  it('delegates the uploaded file buffer', async () => {
    const file = { buffer: Buffer.from('pdf') } as Express.Multer.File;
    await controller.process({}, file);
    expect(service.process).toHaveBeenCalledWith(undefined, file.buffer);
  });
});
