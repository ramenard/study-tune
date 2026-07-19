import { DocumentController } from './document.controller';

describe('DocumentController', () => {
  const service = { process: jest.fn() };
  const req = { user: { id: 'u1' } } as never;
  let controller: DocumentController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DocumentController(service as never);
  });

  it('delegates text processing with the user id', async () => {
    await controller.process(req, { text: 'cours' }, undefined);
    expect(service.process).toHaveBeenCalledWith('u1', 'cours', undefined);
  });

  it('delegates the uploaded file buffer', async () => {
    const file = { buffer: Buffer.from('pdf') } as Express.Multer.File;
    await controller.process(req, {}, file);
    expect(service.process).toHaveBeenCalledWith('u1', undefined, file.buffer);
  });
});
