import {
  Body, Controller, Get, NotFoundException, Param,
  Patch, Post, Req, Res, UploadedFile,
  UseGuards, UseInterceptors
} from '@nestjs/common';
import { Express, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { PDFDocumentsService } from './pdf-documents.service';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { useId } from 'src/utils';
import { createHash } from 'node:crypto';

@Controller('pdf-documents')
export class PDFDocumentsController {

  constructor(
    private service: PDFDocumentsService,
  ) { }

  private async _getOrFail({ user, id }) {
    let pdfDoc = await this.service.read({ user, id });
    if (pdfDoc) {
      pdfDoc = useId(pdfDoc);
      pdfDoc.file_hash = createHash('sha256').update(pdfDoc.file_url || pdfDoc.file_id).digest('hex');
      return pdfDoc;
    }
    throw new NotFoundException();
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  async index(@Req() req: any) {
    const list = await this.service.list({ user: req.user });
    return list.map(useId);
  }

  @Post()
  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(FileInterceptor('file'))
  async create(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return useId(await this.service.create({ user: req.user, file }));
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  async get(@Req() req: any, @Param('id') id: string) {
    return await this._getOrFail({ user: req.user, id });
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard)
  async update(@Req() req: any, @Param('id') id: string, @Body() _pdfDoc: any) {
    const { file_id, ...pdfDoc } = _pdfDoc;
    await this._getOrFail({ user: req.user, id });
    return useId(await this.service.update({ user: req.user, id, pdfDoc }));
  }

  @Post(':id/file')
  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Req() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const pdfDoc = await this._getOrFail({ user: req.user, id });
    const fileId = await this.service.upload({ user: req.user, fileId: pdfDoc.file_id, file });
    await this.service.update({ user: req.user, id, pdfDoc: { ...pdfDoc, file_id: fileId } });
    return {};
  }

  @Get(':id/file')
  @UseGuards(AuthenticatedGuard)
  async download(@Req() req: any, @Res() res: Response, @Param('id') id: string) {
    const pdfDoc = await this._getOrFail({ user: req.user, id });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'max-age=2592000'); // 30 days
    res.sendFile(this.service.getFilePath({ id: pdfDoc.file_id }), { root: '.' });
  }

  @Post(':id/text-locations')
  @UseGuards(AuthenticatedGuard)
  async updateTextLocations(@Req() req: any, @Param('id') id: string, @Body() pageTexts: any) {
    const pdfDoc = await this._getOrFail({ user: req.user, id });
    await this.service.updateTextLocations({ id, fileId: pdfDoc.file_id, pageTexts });
  }
}
